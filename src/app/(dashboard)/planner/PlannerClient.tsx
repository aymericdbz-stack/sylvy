'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { Plus, Loader2, AlertTriangle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import CalendarHeader              from './components/CalendarHeader'
import WeekCalendar, { getMondayOf } from './components/WeekCalendar'
import MonthCalendar               from './components/MonthCalendar'
import EventModal                  from './components/EventModal'
import AiAssistPanel               from './components/AiAssistPanel'
import SyncMenu                    from './components/SyncMenu'
import TaskPanel                   from './components/TaskPanel'
import { useCalendarEvents }        from './hooks/useCalendarEvents'
import { usePlannerTasks }          from './hooks/usePlannerTasks'
import { optimizeWeek }             from '@/lib/scheduler'
import type { Task as SchedulerTask } from '@/lib/scheduler'
import type { ScheduledTaskBlock }  from './components/TaskBlock'

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

// Range for fetching events — full month + buffer for week view
function getRangeForView(view: CalendarView, current: Date): { start: Date; end: Date } {
  if (view === 'week') {
    const monday = getMondayOf(current)
    return { start: addDays(monday, -14), end: addDays(monday, 42) }
  }
  // month: fetch ±2 months
  const start = new Date(current.getFullYear(), current.getMonth() - 1, 1)
  const end   = new Date(current.getFullYear(), current.getMonth() + 2, 1)
  return { start, end }
}

// Events in current week (for sync export)
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
  const [view,        setView]        = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState<Date>(() => getMondayOf(new Date()))
  const [aiOpen,      setAiOpen]      = useState(false)
  const [syncOpen,    setSyncOpen]    = useState(false)
  const [taskPanelOpen, setTaskPanelOpen] = useState(false)
  const [editTask,      setEditTask]      = useState<import('./hooks/usePlannerTasks').PlannerTask | null>(null)
  const [optimizing,    setOptimizing]    = useState(false)

  // Modal state
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editEvent,   setEditEvent]   = useState<CalendarEvent | null>(null)
  const [slotDate,    setSlotDate]    = useState<string | undefined>()
  const [slotTime,    setSlotTime]    = useState<string | undefined>()

  const syncRef = useRef<HTMLDivElement>(null)

  // Data — calendar events
  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getRangeForView(view, currentDate),
    [view, currentDate]
  )
  const { events, loading, error, refetch: refetchEvents, createEvent, updateEvent, deleteEvent } =
    useCalendarEvents(rangeStart, rangeEnd)

  // Data — planner tasks
  const { tasks, loading: tasksLoading, error: tasksError, dirty, createTask, updateTask, deleteTask, bulkUpdateSchedule } =
    usePlannerTasks()

  const monday   = getMondayOf(currentDate)
  const weekEvts = getWeekEvents(events, monday)

  // Build scheduled task blocks from tasks that have scheduled_start
  const scheduledTaskBlocks: ScheduledTaskBlock[] = useMemo(() => {
    return tasks
      .filter(t => t.scheduled_start)
      .map(t => ({
        task: t,
        scheduledStart: new Date(t.scheduled_start!),
        conflict: t.conflict,
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
    if (v === 'month') {
      setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), 1))
    } else {
      setCurrentDate(getMondayOf(new Date()))
    }
  }

  // ── Event interaction ────────────────────────────────────────────────────────
  function handleEventClick(event: CalendarEvent) {
    setEditEvent(event)
    setSlotDate(undefined)
    setSlotTime(undefined)
    setModalOpen(true)
  }

  function handleSlotClick(date: string, time: string) {
    setEditEvent(null)
    setSlotDate(date)
    setSlotTime(time)
    setModalOpen(true)
  }

  function handleDayClick(date: string) {
    setCurrentDate(getMondayOf(new Date(date + 'T00:00:00')))
    setView('week')
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────
  async function handleSave(data: CalendarEventInsert) {
    try {
      if (editEvent && editEvent.source === 'event') {
        await updateEvent(editEvent.id, data)
        toast.success('Événement mis à jour')
      } else {
        await createEvent(data)
        toast.success('Événement créé')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
      throw e
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEvent(id)
      toast.success('Événement supprimé')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
      throw e
    }
  }

  async function handleAddToCalendar(eventsToAdd: CalendarEventInsert[]) {
    try {
      for (const ev of eventsToAdd) await createEvent(ev)
      const n = eventsToAdd.length
      toast.success(`${n} événement${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'ajout')
      throw e
    }
  }

  // ── IA Optimize ─────────────────────────────────────────────────────────────
  const handleOptimize = useCallback(async () => {
    if (tasks.length === 0) {
      toast.error('Aucune tâche à planifier')
      return
    }
    setOptimizing(true)
    try {
      const weekStart = getMondayOf(currentDate)

      // Convert PlannerTasks → SchedulerTasks
      const schedulerTasks: SchedulerTask[] = tasks.map(t => ({
        id:       t.id,
        name:     t.name,
        steps:    t.steps,
        deadline: t.deadline ? new Date(t.deadline) : undefined,
        color:    t.color ?? '#F97316',
      }))

      const result = optimizeWeek(schedulerTasks, weekStart)

      // Bulk update to Supabase
      const updates = result.map(r => ({
        id:              r.id,
        scheduled_start: r.scheduledStart.toISOString(),
        conflict:        r.conflict,
        conflict_reason: r.conflictReason ?? null,
      }))

      await bulkUpdateSchedule(updates)
      toast.success(`Planning optimisé — ${result.length} tâche${result.length > 1 ? 's' : ''} planifiée${result.length > 1 ? 's' : ''}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'optimisation')
    } finally {
      setOptimizing(false)
    }
  }, [tasks, currentDate, bulkUpdateSchedule])

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="pl-app -mx-10 -my-8 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

      {/* Header */}
      <div className="relative flex-shrink-0">
        <CalendarHeader
          view={view}
          currentDate={currentDate}
          events={events}
          aiOpen={aiOpen}
          onViewChange={handleViewChange}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onAiToggle={() => handleOptimize()}
          onSyncOpen={() => setSyncOpen(v => !v)}
        />

        {/* Sync dropdown */}
        <div ref={syncRef} className="absolute right-[88px] top-full z-40">
          <SyncMenu
            open={syncOpen}
            events={events}
            weekEvents={weekEvts}
            onClose={() => setSyncOpen(false)}
          />
        </div>
      </div>

      {/* Dirty banner */}
      {dirty && tasks.length > 0 && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 flex-shrink-0">
          <AlertTriangle size={13} className="text-amber-600" />
          <span className="text-[11px] font-[600] text-amber-700 font-nb-mono">
            Planning obsolète — relancez l&apos;IA
          </span>
          <button
            onClick={handleOptimize}
            disabled={optimizing}
            className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-[600] bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors font-nb-mono disabled:opacity-50"
          >
            {optimizing ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
            Relancer
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Calendar */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {loading && events.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-pl-muted font-nb-mono text-[12px]">
              <Loader2 size={16} className="animate-spin mr-2" />
              Chargement…
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-pl-muted font-nb-mono text-[12px] px-8 text-center">
              <p className="text-pl-error text-[13px] font-[600]">Erreur Supabase</p>
              <p className="text-[11px] leading-relaxed text-pl-muted">{error}</p>
              <button
                onClick={() => refetchEvents()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-[600] bg-pl-orange/10 text-pl-orange hover:bg-pl-orange/20 transition-colors font-nb-mono"
              >
                <RotateCcw size={12} />
                Réessayer
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

        {/* AI assist panel */}
        {aiOpen && (
          <div className="w-[360px] flex-shrink-0 flex flex-col overflow-hidden">
            <AiAssistPanel
              onAddToCalendar={handleAddToCalendar}
              onClose={() => setAiOpen(false)}
            />
          </div>
        )}

      </div>

      {/* FAB — opens task creation panel */}
      <button
        onClick={() => { setEditTask(null); setTaskPanelOpen(true) }}
        className="fixed right-8 bottom-8 z-30 w-11 h-11 rounded-full bg-pl-orange text-white shadow-lg flex items-center justify-center hover:bg-pl-orange-dark transition-colors"
        title="Nouvelle tâche"
      >
        <Plus size={20} />
      </button>

      {/* Task panel — create or edit */}
      <TaskPanel
        open={taskPanelOpen}
        task={editTask}
        onClose={() => { setTaskPanelOpen(false); setEditTask(null) }}
        onSave={createTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />

      {/* Event modal */}
      <EventModal
        open={modalOpen}
        event={editEvent}
        initialDate={slotDate}
        initialTime={slotTime}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => { setModalOpen(false); setEditEvent(null) }}
      />

    </div>
  )
}
