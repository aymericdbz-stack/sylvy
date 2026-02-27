'use client'

import { useState, useMemo, useRef } from 'react'
import { Plus, Loader2, RotateCcw } from 'lucide-react'
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
import type { ScheduledTaskBlock }   from './components/TaskBlock'

import type {
  CalendarView,
  CalendarEvent,
  CalendarEventInsert,
} from './types'

// ── Date helpers ──────────────────────────────────────────────────────────────
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function PlannerClient() {
  const [view,               setView]               = useState<CalendarView>('week')
  const [currentDate,        setCurrentDate]        = useState<Date>(() => getMondayOf(new Date()))
  const [syncOpen,           setSyncOpen]           = useState(false)
  const [taskPanelOpen,      setTaskPanelOpen]      = useState(false)
  const [templatesPanelOpen, setTemplatesPanelOpen] = useState(false)
  const [editTask,           setEditTask]           = useState<import('./hooks/usePlannerTasks').PlannerTask | null>(null)

  const [modalOpen,    setModalOpen]    = useState(false)
  const [editEvent,    setEditEvent]    = useState<CalendarEvent | null>(null)
  const [slotDate,     setSlotDate]     = useState<string | undefined>()
  const [slotTime,     setSlotTime]     = useState<string | undefined>()
  const [slotEndTime,  setSlotEndTime]  = useState<string | undefined>()

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
    tasks,
    createTask, updateTask, deleteTask,
  } = usePlannerTasks()
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useTaskTemplates()

  const monday   = getMondayOf(currentDate)
  const weekEvts = getWeekEvents(events, monday)

  // Scheduled task blocks — manual (always visible) + auto (after optimization)
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

  // ── Navigation ──────────────────────────────────────────────────────────────
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
    setEditEvent(null); setSlotDate(date); setSlotTime(time); setSlotEndTime(endTime); setModalOpen(true)
  }
  function handleDayClick(date: string) {
    setCurrentDate(getMondayOf(new Date(date + 'T00:00:00'))); setView('week')
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────
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
    <div className="pl-app -mx-10 -my-8 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

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
              onTaskClick={task => { setEditTask(task); setTaskPanelOpen(true) }}
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
        templates={templates}
        onClose={() => { setTaskPanelOpen(false); setEditTask(null) }}
        onSave={createTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
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
