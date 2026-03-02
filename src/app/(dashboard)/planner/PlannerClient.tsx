'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Plus, Loader2, RotateCcw, AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'

import CalendarHeader               from './components/CalendarHeader'
import WeekCalendar, { getMondayOf } from './components/WeekCalendar'
import MonthCalendar                from './components/MonthCalendar'
import EventModal                   from './components/EventModal'
import SyncMenu                     from './components/SyncMenu'
import TaskPanel                    from './components/TaskPanel'
import TemplatesPanel               from './components/TemplatesPanel'
import { useCalendarEvents }         from './hooks/useCalendarEvents'
import { usePlannerTasks }           from './hooks/usePlannerTasks'
import { useTaskTemplates }          from './hooks/useTaskTemplates'
import { scheduleWeek, scheduleOneTask } from './scheduler'
import { getWorkHours, getTimezone }     from '@/lib/preferences'
import { tzDatetimeToUTC }               from './utils/timezone'
import type { ScheduledTaskBlock }   from './components/TaskBlock'
import type { PlannerTask, StepData } from './hooks/usePlannerTasks'
import type { PlacementResult, StepSpec, SchedulerTask, WorkHours } from './scheduler'

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
  if (view === 'week') {
    const monday = getMondayOf(current)
    return { start: addDays(monday, -14), end: addDays(monday, 42) }
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

// ── Scheduler helpers ──────────────────────────────────────────────────────────
function taskToSchedulerInput(
  task: PlannerTask,
  weekStart: Date,
  clearScheduled = false,
): SchedulerTask {
  const scheduledStartMin = !clearScheduled && task.scheduled_start
    ? (new Date(task.scheduled_start).getTime() - weekStart.getTime()) / 60000
    : null

  const deadlineMin = task.deadline
    ? (new Date(task.deadline).getTime() - weekStart.getTime()) / 60000
    : null

  const steps: StepSpec[] = (task.steps as StepData[]).map(s => ({
    id:            s.id,
    duration:      s.duration,
    startOffset:   s.startOffset,
    stepType:      s.stepType,
    availableType: s.availableType,
    flexibleDir:   s.flexibleDir,
    flexibleMax:   s.flexibleMax,
  }))

  return {
    id:                task.id,
    priority:          task.priority ?? 'normal',
    deadline:          deadlineMin,
    placement:         task.placement,
    scheduledStartMin,
    steps,
  }
}

function applyResultsToUpdates(
  results: PlacementResult[],
  weekStart: Date,
  taskMap: Map<string, PlannerTask>,
): {
  id:              string
  scheduled_start: string | null
  conflict:        boolean
  conflict_reason: string | null
  steps?:          StepData[]
}[] {
  return results.map(r => {
    const task = taskMap.get(r.id)
    const scheduledStart = r.scheduledStartMin !== null
      ? new Date(weekStart.getTime() + r.scheduledStartMin * 60000).toISOString()
      : null

    // Merge scheduledDuration into steps if the scheduler stretched any flexible step
    let updatedSteps: StepData[] | undefined
    if (r.resolvedSteps && task) {
      const hasStretch = r.resolvedSteps.some(
        rs => rs.stepType === 'available' && rs.availableType === 'flexible' &&
              rs.actualDuration !== (task.steps as StepData[]).find(s => s.id === rs.id)?.duration
      )
      if (hasStretch) {
        updatedSteps = (task.steps as StepData[]).map(s => {
          const resolved = r.resolvedSteps!.find(rs => rs.id === s.id)
          if (resolved && resolved.stepType === 'available' && resolved.availableType === 'flexible') {
            return { ...s, scheduledDuration: resolved.actualDuration }
          }
          return { ...s, scheduledDuration: undefined }
        })
      }
    }

    return {
      id:              r.id,
      scheduled_start: scheduledStart,
      conflict:        r.conflict,
      conflict_reason: r.conflict_reason,
      steps:           updatedSteps,
    }
  })
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function PlannerClient() {
  const [view,               setView]               = useState<CalendarView>('week')
  const [currentDate,        setCurrentDate]        = useState<Date>(() => getMondayOf(new Date()))
  const [syncOpen,           setSyncOpen]           = useState(false)
  const [taskPanelOpen,      setTaskPanelOpen]      = useState(false)
  const [templatesPanelOpen, setTemplatesPanelOpen] = useState(false)
  const [editTask,           setEditTask]           = useState<PlannerTask | null>(null)
  const [selectedStepId,     setSelectedStepId]     = useState<string | null>(null)
  const [isOptimizing,       setIsOptimizing]       = useState(false)

  // Manual placement mode: after creating a task with "Place manually",
  // the next calendar click sets the start time for this task.
  const [manualPlaceTaskId,  setManualPlaceTaskId]  = useState<string | null>(null)

  const [modalOpen,   setModalOpen]   = useState(false)
  const [editEvent,   setEditEvent]   = useState<CalendarEvent | null>(null)
  const [slotDate,    setSlotDate]    = useState<string | undefined>()
  const [slotTime,    setSlotTime]    = useState<string | undefined>()
  const [slotEndTime, setSlotEndTime] = useState<string | undefined>()

  const syncRef = useRef<HTMLDivElement>(null)

  // Data — calendar events
  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getRangeForView(view, currentDate),
    [view, currentDate]
  )
  const { events, loading, error, refetch: refetchEvents, createEvent, updateEvent, deleteEvent } =
    useCalendarEvents(rangeStart, rangeEnd)

  // Data — planner tasks + templates
  const {
    tasks, dirty, setDirty,
    createTask, updateTask, deleteTask, bulkUpdateSchedule,
  } = usePlannerTasks()
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useTaskTemplates()

  const monday   = getMondayOf(currentDate)
  const weekEvts = getWeekEvents(events, monday)

  // Show dirty banner when there are auto tasks and the dirty flag is set
  const showDirtyBanner = dirty && tasks.some(t => t.placement === 'auto')

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
    setCurrentDate(d => view === 'week' ? addDays(d, -7) : addMonths(d, -1))
  }
  function handleNext() {
    setCurrentDate(d => view === 'week' ? addDays(d, 7) : addMonths(d, 1))
  }
  function handleToday() {
    if (view === 'week') setCurrentDate(getMondayOf(new Date()))
    else setCurrentDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  }
  function handleViewChange(v: CalendarView) {
    setView(v)
    if (v === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), 1))
    else               setCurrentDate(getMondayOf(new Date()))
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
    setCurrentDate(getMondayOf(new Date(date + 'T00:00:00'))); setView('week')
  }

  // ── Manual placement ─────────────────────────────────────────────────────────
  async function handleManualPlaceAt(taskId: string, date: string, time: string) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const tz  = getTimezone()
    const utc = tzDatetimeToUTC(date, time, tz)
    try {
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

  // ── Optimize all auto tasks for current week ─────────────────────────────────
  const handleOptimizeAll = useCallback(async () => {
    setIsOptimizing(true)
    try {
      const weekStart = getMondayOf(currentDate)
      const wh: WorkHours = getWorkHours()
      const weekTasks = tasks  // schedule all tasks; manual ones become fixed constraints

      const nowMin  = (Date.now() - weekStart.getTime()) / 60000
      const inputs  = weekTasks.map(t =>
        taskToSchedulerInput(t, weekStart, t.placement === 'auto')
      )
      const results = scheduleWeek(inputs, wh, 7 * 1440, nowMin)
      if (!results.length) {
        toast.info('No auto tasks to schedule this week')
        setIsOptimizing(false)
        return
      }

      const taskMap = new Map(tasks.map(t => [t.id, t]))
      const updates = applyResultsToUpdates(results, weekStart, taskMap)
      await bulkUpdateSchedule(updates)

      const placed     = results.filter(r => !r.conflict).length
      const conflicted = results.filter(r => r.conflict).length
      if (conflicted > 0) {
        toast.warning(`${placed} task${placed !== 1 ? 's' : ''} scheduled · ${conflicted} conflict${conflicted !== 1 ? 's' : ''} detected`)
      } else {
        toast.success(`${placed} task${placed !== 1 ? 's' : ''} scheduled`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Optimization failed')
    } finally {
      setIsOptimizing(false)
    }
  }, [tasks, currentDate, bulkUpdateSchedule])

  // ── Optimize a single newly-created task ─────────────────────────────────────
  const handleOptimizeTask = useCallback(async (taskId: string) => {
    // Refetch is already done by createTask — tasks state is fresh
    setIsOptimizing(true)
    try {
      const weekStart = getMondayOf(currentDate)
      const wh: WorkHours = getWorkHours()

      const allCurrent = tasks // createTask already re-fetched
      const newTask    = allCurrent.find(t => t.id === taskId)
      if (!newTask) {
        toast.info('Task created — run Optimize to schedule it')
        setIsOptimizing(false)
        return
      }

      const nowMin      = (Date.now() - weekStart.getTime()) / 60000
      const newInput    = taskToSchedulerInput(newTask, weekStart, true)
      const allInputs   = allCurrent.map(t => taskToSchedulerInput(t, weekStart))
      const result      = scheduleOneTask(newInput, allInputs, wh, 7 * 1440, nowMin)

      const taskMap = new Map(allCurrent.map(t => [t.id, t]))
      const updates = applyResultsToUpdates([result], weekStart, taskMap)
      await bulkUpdateSchedule(updates)

      if (result.conflict) {
        toast.warning(`Could not schedule: ${result.conflict_reason}`)
      } else {
        toast.success('Task scheduled')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Optimization failed')
    } finally {
      setIsOptimizing(false)
    }
  }, [tasks, currentDate, bulkUpdateSchedule])

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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="pl-app -mx-10 -my-8 flex flex-col overflow-hidden" style={{ height: '100vh' }}>

      {/* Dirty banner */}
      {showDirtyBanner && (
        <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 bg-amber-50 border-b border-amber-200 z-20">
          <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
          <span className="text-[11px] font-[600] text-amber-700 font-nb-mono flex-1">
            Schedule may be suboptimal — tasks were added or edited since the last optimization.
          </span>
          <button
            onClick={handleOptimizeAll}
            disabled={isOptimizing}
            className="text-[11px] font-[700] font-nb-mono text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors disabled:opacity-50"
          >
            Re-optimize now
          </button>
          <button onClick={() => setDirty(false)} className="text-amber-500 hover:text-amber-700 transition-colors">
            <X size={13} />
          </button>
        </div>
      )}

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
          onSyncOpen={() => setSyncOpen(v => !v)}
          onTemplatesOpen={() => { setTemplatesPanelOpen(true); setSyncOpen(false) }}
          onOptimize={handleOptimizeAll}
          isOptimizing={isOptimizing}
        />

        <div ref={syncRef} className="absolute right-[88px] top-full z-40">
          <SyncMenu
            open={syncOpen}
            events={events}
            weekEvents={weekEvts}
            onClose={() => setSyncOpen(false)}
          />
        </div>
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
            />
          ) : (
            <MonthCalendar
              month={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditTask(null); setTaskPanelOpen(true) }}
        className="fixed right-8 bottom-8 z-30 w-11 h-11 rounded-full bg-pl-orange text-white shadow-lg flex items-center justify-center hover:bg-pl-orange-dark transition-colors"
        title="New task"
      >
        <Plus size={20} />
      </button>

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
        onOptimizeTask={handleOptimizeTask}
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
