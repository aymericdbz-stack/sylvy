'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Plus, BookTemplate, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import CalendarHeader               from './components/CalendarHeader'
import WeekCalendar, { getMondayOf } from './components/WeekCalendar'
import MonthCalendar                  from './components/MonthCalendar'
import DayCalendar                    from './components/DayCalendar'
import YearCalendar                   from './components/YearCalendar'
import EventModal                   from './components/EventModal'
import TaskPanel                    from './components/TaskPanel'
import TemplatesPanel               from './components/TemplatesPanel'
import { useCalendarEvents }         from './hooks/useCalendarEvents'
import { usePlannerTasks }           from './hooks/usePlannerTasks'
import { useTaskTemplates }          from './hooks/useTaskTemplates'
import { getWorkHours, getPlannerWeekendsEnabled, getTimezone } from '@/lib/preferences'
import { tzDatetimeToUTC }               from './utils/timezone'
import { downloadIcal }                  from './utils/ical'
import type { ScheduledTaskBlock }   from './components/TaskBlock'
import type { PlannerTask, StepData } from './hooks/usePlannerTasks'

import type {
  CalendarView,
  CalendarEvent,
  CalendarEventInsert,
} from './types'

// ── Date helpers ───────────────────────────────────────────────────────────────
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}
function addMonths(d: Date, n: number): Date {
  const r = new Date(d); r.setMonth(r.getMonth() + n); return r
}
function getRangeForView(view: CalendarView, current: Date): { start: Date; end: Date } {
  if (view === 'day') {
    const start = addDays(current, -7)
    const end   = addDays(current, 7)
    return { start, end }
  }
  if (view === 'week') {
    const monday = getMondayOf(current)
    return { start: addDays(monday, -14), end: addDays(monday, 42) }
  }
  if (view === 'year') {
    const start = new Date(current.getFullYear() - 1, 0, 1)
    const end   = new Date(current.getFullYear() + 2, 0, 1)
    return { start, end }
  }
  const start = new Date(current.getFullYear(), current.getMonth() - 1, 1)
  const end   = new Date(current.getFullYear(), current.getMonth() + 2, 1)
  return { start, end }
}
function getWeekEvents(events: CalendarEvent[], monday: Date): CalendarEvent[] {
  const sunday = addDays(monday, 6)
  const sISO   = monday.toISOString().slice(0, 10)
  const eISO   = sunday.toISOString().slice(0, 10)
  return events.filter(ev => {
    const d = ev.start_at.slice(0, 10)
    return d >= sISO && d <= eISO
  })
}

// ── Helpers: placement validation (working hours + overlaps) ───────────────────

interface PlacementCheckResult {
  ok: boolean
  reason?: string
}

function isBusinessDay(date: Date, includeWeekends: boolean): boolean {
  if (includeWeekends) return true
  const dow = date.getDay() // 0=Sun, 1=Mon, ... 6=Sat
  return dow >= 1 && dow <= 5
}

function validateTaskPlacement(
  task: PlannerTask,
  scheduledStartLocal: Date,
  allTasks: PlannerTask[],
  workHours: { start: number; end: number },
  includeWeekends: boolean,
): PlacementCheckResult {
  const steps = task.steps as StepData[]
  const dayStartMin = workHours.start * 60
  const dayEndMin   = workHours.end * 60

  const busyIntervals: Array<{ start: Date; end: Date }> = []

  for (const step of steps) {
    const dur = step.scheduledDuration ?? step.duration
    const stepStart = new Date(scheduledStartLocal.getTime() + step.startOffset * 60_000)
    const stepEnd   = new Date(stepStart.getTime() + dur * 60_000)

    if (!isBusinessDay(stepStart, includeWeekends) || !isBusinessDay(stepEnd, includeWeekends)) {
      // Busy steps can never run on non-working days; available steps only if explicitly overnight
      if (step.stepType === 'busy' || !step.overnight) {
        return { ok: false, reason: 'This template cannot cross into non-working days here.' }
      }
    }

    const sameDay = stepStart.toDateString() === stepEnd.toDateString()
    const startMinutes = stepStart.getHours() * 60 + stepStart.getMinutes()
    const endMinutes   = stepEnd.getHours() * 60 + stepEnd.getMinutes()

    if (step.stepType === 'busy') {
      // Busy steps must fit entirely inside one working day window
      if (!sameDay || startMinutes < dayStartMin || endMinutes > dayEndMin) {
        return { ok: false, reason: 'This template does not fit inside your working hours at this time.' }
      }
      busyIntervals.push({ start: stepStart, end: stepEnd })
    } else {
      // Available steps: only overnight ones are allowed to cross working-hours boundaries
      const crossesBounds = !sameDay || startMinutes < dayStartMin || endMinutes > dayEndMin
      if (crossesBounds && !step.overnight) {
        return { ok: false, reason: 'Only overnight steps may cross your working hours.' }
      }
      // Available steps do not consume busy time; no interval added
    }
  }

  // Overlap check against other tasks' busy intervals
  const others = allTasks.filter(t => t.id !== task.id && t.scheduled_start)
  for (const other of others) {
    const otherStart = new Date(other.scheduled_start!)
    const otherSteps = other.steps as StepData[]
    for (const s of otherSteps) {
      if (s.stepType !== 'busy') continue
      const dur = s.scheduledDuration ?? s.duration
      const sStart = new Date(otherStart.getTime() + s.startOffset * 60_000)
      const sEnd   = new Date(sStart.getTime() + dur * 60_000)

      for (const bi of busyIntervals) {
        if (bi.start < sEnd && bi.end > sStart) {
          return { ok: false, reason: 'This template would overlap another busy template here.' }
        }
      }
    }
  }

  return { ok: true }
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function PlannerClient() {
  const [view,               setView]               = useState<CalendarView>('week')
  const [currentDate,        setCurrentDate]        = useState<Date>(() => getMondayOf(new Date()))
  const [taskPanelOpen,      setTaskPanelOpen]      = useState(false)
  const [templatesPanelOpen, setTemplatesPanelOpen] = useState(false)
  const [editTask,           setEditTask]           = useState<PlannerTask | null>(null)
  const [selectedStepId,     setSelectedStepId]     = useState<string | null>(null)

  // Manual placement mode: after creating a task with "Place manually",
  // the next calendar click sets the start time for this task.
  const [manualPlaceTaskId,  setManualPlaceTaskId]  = useState<string | null>(null)

  const [modalOpen,   setModalOpen]   = useState(false)
  const [editEvent,   setEditEvent]   = useState<CalendarEvent | null>(null)
  const [slotDate,    setSlotDate]    = useState<string | undefined>()
  const [slotTime,    setSlotTime]    = useState<string | undefined>()
  const [slotEndTime, setSlotEndTime] = useState<string | undefined>()

  const [workHours, setWorkHoursState] = useState(() => getWorkHours())
  const [includeWeekends, setIncludeWeekends] = useState(() => getPlannerWeekendsEnabled())

  // Data — calendar events
  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getRangeForView(view, currentDate),
    [view, currentDate]
  )
  const { events, loading, error, refetch: refetchEvents, createEvent, updateEvent, deleteEvent } =
    useCalendarEvents(rangeStart, rangeEnd)

  // Data — planner tasks + templates
  const {
    tasks,
    // dirty, setDirty,
    createTask, updateTask, deleteTask, bulkUpdateSchedule,
  } = usePlannerTasks()
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useTaskTemplates()

  const monday   = getMondayOf(currentDate)
  const weekEvts = getWeekEvents(events, monday)

  // Show dirty banner when there are auto tasks and the dirty flag is set
  const showDirtyBanner = false

  // Scheduled task blocks
  const scheduledTaskBlocks: ScheduledTaskBlock[] = useMemo(() => {
    return tasks
      .filter(t => t.scheduled_start)
      .map(t => ({
        task:           t,
        scheduledStart: new Date(t.scheduled_start!),
        conflict:       t.conflict,
        conflictReason: t.conflict_reason ?? undefined,
      }))
  }, [tasks])

  // Re-read work hours / weekend setting when changed in settings
  useEffect(() => {
    function handleStorage() {
      setWorkHoursState(getWorkHours())
      setIncludeWeekends(getPlannerWeekendsEnabled())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Close manual placement mode on Escape
  useEffect(() => {
    if (!manualPlaceTaskId) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setManualPlaceTaskId(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [manualPlaceTaskId])

  // ── Navigation ───────────────────────────────────────────────────────────────
  function handlePrev() {
    setCurrentDate(d => {
      if (view === 'day') return addDays(d, -1)
      if (view === 'week') return addDays(d, -7)
      if (view === 'year') return new Date(d.getFullYear() - 1, 0, 1)
      return addMonths(d, -1)
    })
  }
  function handleNext() {
    setCurrentDate(d => {
      if (view === 'day') return addDays(d, 1)
      if (view === 'week') return addDays(d, 7)
      if (view === 'year') return new Date(d.getFullYear() + 1, 0, 1)
      return addMonths(d, 1)
    })
  }
  function handleToday() {
    const now = new Date()
    if (view === 'day') setCurrentDate(now)
    else if (view === 'week') setCurrentDate(getMondayOf(now))
    else if (view === 'year') setCurrentDate(new Date(now.getFullYear(), 0, 1))
    else setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1))
  }
  function handleViewChange(v: CalendarView) {
    setView(v)
    const now = new Date()
    if (v === 'day') setCurrentDate(now)
    else if (v === 'week') setCurrentDate(getMondayOf(now))
    else if (v === 'month') setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1))
    else setCurrentDate(new Date(now.getFullYear(), 0, 1))
  }

  // ── Event interaction ────────────────────────────────────────────────────────
  function handleEventClick(event: CalendarEvent) {
    setEditEvent(event); setSlotDate(undefined); setSlotTime(undefined); setModalOpen(true)
  }

  function handleSlotClick(date: string, time: string, endTime?: string) {
    // If in manual placement mode, place the pending task here
    if (manualPlaceTaskId) {
      handleManualPlaceAt(manualPlaceTaskId, date, time)
      setManualPlaceTaskId(null)
      return
    }
    setEditEvent(null); setSlotDate(date); setSlotTime(time); setSlotEndTime(endTime); setModalOpen(true)
  }

  function handleDayClick(date: string) {
    const d = new Date(date + 'T00:00:00')
    setCurrentDate(d)
    setView('day')
  }

  // ── Manual placement ─────────────────────────────────────────────────────────
  async function handleManualPlaceAt(taskId: string, date: string, time: string) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const tz  = getTimezone()
    const utc = tzDatetimeToUTC(date, time, tz)
    try {
      // Working-hours + overlap validation before persisting
      const scheduledStartLocal = new Date(`${date}T${time}:00`)
      const ok = validateTaskPlacement(task, scheduledStartLocal, tasks, workHours, includeWeekends)
      if (!ok.ok) {
        toast.error(ok.reason ?? 'This task cannot be placed here')
        return
      }

      await updateTask(taskId, {
        name:            task.name,
        description:     task.description,
        priority:        task.priority,
        placement:       'manual',
        deadline:        task.deadline,
        steps:           task.steps,
        color:           task.color,
        scheduled_start: utc,
      })
      toast.success('Task placed')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error placing task')
    }
  }

  async function handleTaskMove(taskId: string, date: string, time: string) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const tz  = getTimezone()
    const utc = tzDatetimeToUTC(date, time, tz)
    try {
      const scheduledStartLocal = new Date(`${date}T${time}:00`)
      const ok = validateTaskPlacement(task, scheduledStartLocal, tasks, workHours, includeWeekends)
      if (!ok.ok) {
        toast.error(ok.reason ?? 'This task cannot be placed here')
        return
      }

      await updateTask(taskId, {
        name:            task.name,
        description:     task.description,
        priority:        task.priority,
        placement:       'manual',
        deadline:        task.deadline,
        steps:           task.steps,
        color:           task.color,
        scheduled_start: utc,
      })
      toast.success('Task updated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error updating task')
    }
  }

  // ── Calendar event CRUD ──────────────────────────────────────────────────────
  async function handleSave(data: CalendarEventInsert) {
    try {
      if (editEvent && editEvent.source === 'event') {
        await updateEvent(editEvent.id, data); toast.success('Event updated')
      } else {
        await createEvent(data); toast.success('Event created')
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Error'); throw e }
  }

  async function handleDelete(id: string) {
    try { await deleteEvent(id); toast.success('Event deleted') }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Error'); throw e }
  }

  // ── Keyboard shortcuts for view switching (D/W/M/Y) ──────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Ignore if focused inside an input/textarea/select
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      const key = e.key.toLowerCase()
      if (key === 'd') setView('day')
      else if (key === 'w') setView('week')
      else if (key === 'm') setView('month')
      else if (key === 'y') setView('year')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Download current week as .ics ────────────────────────────────────────────
  function handleDownloadWeek() {
    downloadIcal(weekEvts, 'sylvy-week.ics')
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="pl-app flex flex-col overflow-hidden" style={{ height: '100vh' }}>

      {/* Manual placement banner */}
      {manualPlaceTaskId && (
        <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 bg-pl-charcoal text-white z-20">
          <span className="text-[11px] font-[600] font-nb-mono flex-1">
            Click on the calendar to set the task start time
          </span>
          <button
            onClick={() => setManualPlaceTaskId(null)}
            className="text-[11px] font-nb-mono text-white/60 hover:text-white transition-colors"
          >
            Cancel (Esc)
          </button>
        </div>
      )}

      {/* Header */}
      <div className="relative flex-shrink-0">
        <CalendarHeader
          view={view}
          currentDate={currentDate}
          events={events}
          onViewChange={handleViewChange}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onDownloadWeek={handleDownloadWeek}
          onTemplatesOpen={() => { setTemplatesPanelOpen(true) }}
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          {loading && events.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-pl-muted font-nb-mono text-[12px]">
              <Loader2 size={16} className="animate-spin mr-2" />
              Loading…
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-pl-muted font-nb-mono text-[12px] px-8 text-center">
              <p className="text-pl-error text-[13px] font-[600]">Supabase error</p>
              <p className="text-[11px] leading-relaxed text-pl-muted">{error}</p>
              <button
                onClick={() => refetchEvents()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-[600] bg-pl-orange/10 text-pl-orange hover:bg-pl-orange/20 transition-colors font-nb-mono"
              >
                <RotateCcw size={12} /> Retry
              </button>
            </div>
          ) : view === 'day' ? (
            <DayCalendar
              date={currentDate}
              events={events}
              scheduledTasks={scheduledTaskBlocks}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              onTaskClick={(task, stepId) => {
                setEditTask(task)
                setSelectedStepId(stepId ?? null)
                setTaskPanelOpen(true)
              }}
              workStartHour={workHours.start}
              workEndHour={workHours.end}
              onTaskMove={handleTaskMove}
            />
          ) : view === 'week' ? (
            <WeekCalendar
              weekStart={getMondayOf(currentDate)}
              events={events}
              scheduledTasks={scheduledTaskBlocks}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              onTaskClick={(task, stepId) => {
                setEditTask(task)
                setSelectedStepId(stepId ?? null)
                setTaskPanelOpen(true)
              }}
              workStartHour={workHours.start}
              workEndHour={workHours.end}
              includeWeekends={includeWeekends}
              onTaskMove={handleTaskMove}
            />
          ) : view === 'month' ? (
            <MonthCalendar
              month={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          ) : (
            <YearCalendar
              yearDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          )}
        </div>
      </div>

      {/* Floating actions: new task + templates */}
      <div className="fixed right-8 bottom-8 z-30 flex flex-col items-end gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setTemplatesPanelOpen(true) }}
            className="w-11 h-11 rounded-full bg-pl-cream-dark text-pl-charcoal shadow-lg flex items-center justify-center hover:bg-pl-cream border border-pl-cream-border transition-colors"
            title="Task templates"
          >
            <BookTemplate size={18} />
          </button>
          <button
            onClick={() => { setEditTask(null); setTaskPanelOpen(true) }}
            className="w-11 h-11 rounded-full bg-pl-orange text-white shadow-lg flex items-center justify-center hover:bg-pl-orange-dark transition-colors"
            title="New task"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Task panel */}
      <TaskPanel
        open={taskPanelOpen}
        task={editTask}
        selectedStepId={selectedStepId}
        templates={templates}
        onClose={() => { setTaskPanelOpen(false); setEditTask(null); setSelectedStepId(null) }}
        onSave={createTask}
        onSaveTemplate={createTemplate}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onManualPlace={setManualPlaceTaskId}
      />

      {/* Templates panel */}
      <TemplatesPanel
        open={templatesPanelOpen}
        templates={templates}
        onClose={() => setTemplatesPanelOpen(false)}
        onCreate={createTemplate}
        onUpdate={updateTemplate}
        onDelete={deleteTemplate}
      />

      {/* Event modal */}
      <EventModal
        open={modalOpen}
        event={editEvent}
        initialDate={slotDate}
        initialTime={slotTime}
        initialEndTime={slotEndTime}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => { setModalOpen(false); setEditEvent(null); setSlotEndTime(undefined) }}
      />

    </div>
  )
}
