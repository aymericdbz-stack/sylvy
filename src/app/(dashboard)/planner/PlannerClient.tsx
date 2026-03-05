'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { BookTemplate, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import CalendarHeader                 from './components/CalendarHeader'
import WeekCalendar, { getMondayOf }  from './components/WeekCalendar'
import MonthCalendar                  from './components/MonthCalendar'
import DayCalendar                    from './components/DayCalendar'
import YearCalendar                   from './components/YearCalendar'
import EventModal                     from './components/EventModal'
import TaskPanel                      from './components/TaskPanel'
import TemplatesPanel                 from './components/TemplatesPanel'
import { useCalendarEvents }          from './hooks/useCalendarEvents'
import { usePlannerTasks }            from './hooks/usePlannerTasks'
import { useTaskTemplates }           from './hooks/useTaskTemplates'
import { getWorkHours, getPlannerWeekendsEnabled, getTimezone } from '@/lib/preferences'
import { tzDatetimeToUTC }            from './utils/timezone'
import { downloadIcal, generateIcal } from './utils/ical'
import { pickDistinctPlannerColor }  from './utils/colors'
import type { ScheduledTaskBlock }    from './components/TaskBlock'
import type { PlannerTask, StepData } from './hooks/usePlannerTasks'
import { solveIntercalation, getEffectiveStepPositions, type IntercalationResult } from './engine/solveIntercalation'

import type {
  CalendarView,
  CalendarEvent,
  CalendarEventInsert,
  EventColor,
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

// Build one VEVENT per busy step of each scheduled task block that falls
// within the given week. This is what populates the visual schedule, so
// exporting these gives the user a faithful .ics of their planner.
function hexToEventColor(hex: string | null | undefined): EventColor {
  switch (hex) {
    case '#F97316': return 'orange'
    case '#4CAF7D': return 'green'
    case '#3B82F6': return 'blue'
    case '#8B5CF6': return 'purple'
    case '#EF4444': return 'red'
    case '#14B8A6': return 'teal'
    default:        return 'orange'
  }
}

function buildTaskEventsForWeek(
  blocks: ScheduledTaskBlock[],
  monday: Date,
): CalendarEvent[] {
  const startOfWeek = new Date(monday)
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(monday)
  endOfWeek.setDate(endOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const events: CalendarEvent[] = []

  for (const block of blocks) {
    const { task, scheduledStart } = block
    if (!scheduledStart) continue

    const steps = task.steps as StepData[]
    if (!steps.length) continue

    for (const step of steps) {
      if (step.stepType !== 'busy') continue
      const dur = step.scheduledDuration ?? step.duration
      if (dur <= 0) continue

      const stepStart = new Date(scheduledStart.getTime() + step.startOffset * 60_000)
      const stepEnd   = new Date(stepStart.getTime() + dur * 60_000)

      if (stepEnd < startOfWeek || stepStart > endOfWeek) continue

      events.push({
        id:          `task-${task.id}-${step.id}`,
        title:       task.name,
        description: step.name ? `${step.name} (${dur} min)` : null,
        start_at:    stepStart.toISOString(),
        end_at:      stepEnd.toISOString(),
        all_day:     false,
        color:       hexToEventColor(task.color),
        experiment_id: null,
        protocol_id:   null,
        location:      null,
        source:        'event',
      })
    }
  }

  return events
}

// ── Helpers: placement validation (working hours + overlaps) ───────────────────

interface PlacementCheckResult {
  ok: boolean
  reason?: string
  weekendWarning?: boolean
}

function toISODateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function minToHHMM(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
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

  // Use getEffectiveStepPositions to correctly compute positions with cumulative
  // deltas from expanded overnight steps (scheduledDuration may differ from duration)
  const taskStartMin = scheduledStartLocal.getHours() * 60 + scheduledStartLocal.getMinutes()
  const taskDateMidnight = new Date(scheduledStartLocal)
  taskDateMidnight.setHours(0, 0, 0, 0)

  const positions = getEffectiveStepPositions(taskStartMin, steps)
  const busyIntervals: Array<{ start: Date; end: Date }> = []
  let weekendWarning = false

  for (const { step, start: absStart, end: absEnd } of positions) {
    // Convert absolute minutes-from-midnight to Date objects (handles multi-day)
    const startDayOff   = Math.floor(absStart / 1440)
    const startMinInDay = absStart % 1440
    const endDayOff     = Math.floor(absEnd / 1440)
    const endMinInDay   = absEnd % 1440

    const stepStart = new Date(taskDateMidnight)
    stepStart.setDate(taskDateMidnight.getDate() + startDayOff)
    stepStart.setHours(Math.floor(startMinInDay / 60), startMinInDay % 60, 0, 0)

    const stepEnd = new Date(taskDateMidnight)
    stepEnd.setDate(taskDateMidnight.getDate() + endDayOff)
    stepEnd.setHours(Math.floor(endMinInDay / 60), endMinInDay % 60, 0, 0)

    if (!isBusinessDay(stepStart, includeWeekends) || !isBusinessDay(stepEnd, includeWeekends)) {
      if (step.stepType === 'busy' || !step.overnight) {
        return { ok: false, reason: 'This template cannot cross into non-working days here.' }
      }
      // Overnight available step spans a weekend — warn but allow
      if (!includeWeekends) weekendWarning = true
    }

    const sameDay       = startDayOff === endDayOff
    const startMinutes  = startMinInDay
    const endMinutes    = endMinInDay

    if (step.stepType === 'busy') {
      // Busy steps must fit entirely inside one working day window
      if (!sameDay || startMinutes < dayStartMin || endMinutes > dayEndMin) {
        return { ok: false, reason: 'This template does not fit inside your working hours at this time.' }
      }
      busyIntervals.push({ start: stepStart, end: stepEnd })
    } else {
      // Available steps: only overnight ones may cross working-hours boundaries
      const crossesBounds = !sameDay || startMinutes < dayStartMin || endMinutes > dayEndMin
      if (crossesBounds && !step.overnight) {
        return { ok: false, reason: 'Only overnight steps may cross your working hours.' }
      }
    }
  }

  // Overlap check against other tasks' busy intervals
  const others = allTasks.filter(t => t.id !== task.id && t.scheduled_start)
  for (const other of others) {
    const otherStartLocal = new Date(other.scheduled_start!)
    const otherStartMin = otherStartLocal.getHours() * 60 + otherStartLocal.getMinutes()
    const otherDateMidnight = new Date(otherStartLocal)
    otherDateMidnight.setHours(0, 0, 0, 0)
    const otherSteps = other.steps as StepData[]
    for (const { step: s, start: sAbsStart, end: sAbsEnd } of getEffectiveStepPositions(otherStartMin, otherSteps)) {
      if (s.stepType !== 'busy') continue
      const sDayOff = Math.floor(sAbsStart / 1440)
      const sMinInDay = sAbsStart % 1440
      const sEndDayOff = Math.floor(sAbsEnd / 1440)
      const sEndMinInDay = sAbsEnd % 1440

      const sStart = new Date(otherDateMidnight)
      sStart.setDate(otherDateMidnight.getDate() + sDayOff)
      sStart.setHours(Math.floor(sMinInDay / 60), sMinInDay % 60, 0, 0)

      const sEnd = new Date(otherDateMidnight)
      sEnd.setDate(otherDateMidnight.getDate() + sEndDayOff)
      sEnd.setHours(Math.floor(sEndMinInDay / 60), sEndMinInDay % 60, 0, 0)

      for (const bi of busyIntervals) {
        if (bi.start < sEnd && bi.end > sStart) {
          return { ok: false, reason: 'This template would overlap another busy template here.' }
        }
      }
    }
  }

  return { ok: true, weekendWarning: weekendWarning || undefined }
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

  // When creating a template, ensure its color is distinct from what's currently visible in the planner UI.
  const createTemplateDistinct = useCallback(async (data: import('./hooks/useTaskTemplates').TaskTemplateInsert) => {
    const used = [
      ...tasks.map(t => t.color),
      ...templates.map(t => t.color),
    ]
    const color = pickDistinctPlannerColor(used, data.color ?? null)
    return createTemplate({ ...data, color })
  }, [createTemplate, tasks, templates])

  const pendingTask = useMemo(
    () => (manualPlaceTaskId ? tasks.find(t => t.id === manualPlaceTaskId) ?? null : null),
    [manualPlaceTaskId, tasks],
  )

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

  // Auto-repair: if a task is already outside working hours (legacy bug),
  // snap it back to the nearest valid in-hours start so it becomes movable again.
  const repairedOutOfHoursRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!tasks.length) return

    const tz = getTimezone()
    let cancelled = false

    ;(async () => {
      for (const t of tasks) {
        if (cancelled) return
        if (!t.scheduled_start) continue
        if (repairedOutOfHoursRef.current.has(t.id)) continue

        const scheduledStartLocal = new Date(t.scheduled_start)
        const check = validateTaskPlacement(t, scheduledStartLocal, tasks, workHours, includeWeekends)
        if (check.ok) continue

        // Only auto-repair tasks that violate working-hours/day rules (not generic conflicts).
        const reason = check.reason ?? ''
        const looksLikeWorkHoursIssue =
          reason.includes('working hours') ||
          reason.includes('non-working days') ||
          reason.includes('overnight')

        if (!looksLikeWorkHoursIssue) continue

        const startMin = scheduledStartLocal.getHours() * 60 + scheduledStartLocal.getMinutes()
        const result = solveIntercalation({
          existingTasks: [],
          newTask: { taskId: t.id, startMin, steps: t.steps as StepData[] },
          workHours,
        })
        const repaired = result.placements.find(p => p.taskId === t.id)
        if (!repaired) continue
        if (repaired.startMin === startMin) continue

        repairedOutOfHoursRef.current.add(t.id)

        const dateISO = toISODateLocal(scheduledStartLocal)
        const utc = tzDatetimeToUTC(dateISO, minToHHMM(repaired.startMin), tz)
        try {
          await updateTask(t.id, {
            name:            t.name,
            description:     t.description,
            priority:        t.priority,
            placement:       t.placement,
            deadline:        t.deadline,
            steps:           t.steps,
            color:           t.color,
            scheduled_start: utc,
          })
          toast.info(`Moved "${t.name}" back into working hours.`)
        } catch {
          // If this fails (network, permissions), user can still move manually once it’s in a valid spot.
        }
      }
    })()

    return () => { cancelled = true }
  }, [tasks, workHours, includeWeekends, updateTask])

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
    setEditEvent(event); setModalOpen(true)
  }

  async function handleEventMove(
    eventId: string,
    date: string,
    startTime: string,
    endTime: string,
    endDate?: string,
  ) {
    const tz = getTimezone()
    const startUTC = tzDatetimeToUTC(date, startTime, tz)
    const endUTC = tzDatetimeToUTC(endDate ?? date, endTime, tz)
    try {
      await updateEvent(eventId, { start_at: startUTC, end_at: endUTC })
      toast.success('Event moved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error moving event')
      throw e
    }
  }

  function handleSlotClick(date: string, time: string, endTime?: string) {
    // If in manual placement mode, place the pending task here
    if (manualPlaceTaskId) {
      handleManualPlaceAt(manualPlaceTaskId, date, time)
      setManualPlaceTaskId(null)
      return
    }

    // Create a single-step template (busy, not overnight) and place it immediately
    const tz = getTimezone()
    const utc = tzDatetimeToUTC(date, time, tz)

    let durationMin = 60
    if (endTime) {
      const [sh, sm] = time.split(':').map(Number)
      const [eh, em] = endTime.split(':').map(Number)
      durationMin = (eh * 60 + em) - (sh * 60 + sm)
      if (durationMin < 15) durationMin = 30
    }

    const step: StepData = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      duration: durationMin,
      startOffset: 0,
      stepType: 'busy',
      availableType: 'flexible',
      overnight: false,
    }

    const usedColors = [
      ...tasks.map(t => t.color),
      ...templates.map(t => t.color),
    ]
    const color = pickDistinctPlannerColor(usedColors, null)

    createTask({
      name: 'New block',
      steps: [step],
      color,
      placement: 'manual',
      scheduled_start: utc,
    })
      .then(() => toast.success('Block created'))
      .catch(e => toast.error(e instanceof Error ? e.message : 'Error'))
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
        toast.error(ok.reason ?? 'This template cannot be placed here')
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
      toast.success('Template placed')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error placing template')
    }
  }

  async function handleTaskMove(
    taskId: string,
    date: string,
    time: string,
    solverResult?: IntercalationResult,
  ) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const tz  = getTimezone()
    const utc = tzDatetimeToUTC(date, time, tz)

    // Note: optimistic state is now handled at the usePlannerTasks level
    // We don't set optimisticTaskMove here anymore to avoid dual state management

    try {
      // Safety guard: never persist a placement outside working hours.
      // (The intercalation solver also enforces this, but this prevents any edge cases.)
      const scheduledStartLocal = new Date(`${date}T${time}:00`)
      const tasksForValidation = solverResult
        ? tasks.map(t => {
            const placement = solverResult.placements.find(p => p.taskId === t.id)
            return placement ? ({ ...t, steps: placement.steps } as PlannerTask) : t
          })
        : tasks
      const movedPlacement = solverResult?.placements.find(p => p.taskId === taskId)
      const taskForValidation = movedPlacement
        ? ({ ...task, steps: movedPlacement.steps } as PlannerTask)
        : task

      const ok = validateTaskPlacement(taskForValidation, scheduledStartLocal, tasksForValidation, workHours, includeWeekends)
      if (!ok.ok) {
        toast.error(ok.reason ?? 'This template cannot be placed here')
        return
      }
      if (ok.weekendWarning) {
        toast.info('This template spans the weekend. It will resume Monday morning.')
      }

      // If the solver adjusted other tasks (flex steps), persist all changes
      if (solverResult && solverResult.placements.length > 1) {
        const updates = solverResult.placements.map(p => {
          const existingTask = tasks.find(t => t.id === p.taskId)
          if (!existingTask) return null

          // For the moved task, use the date/time from the drag
          if (p.taskId === taskId) {
            return {
              id:              taskId,
              scheduled_start: utc,
              conflict:        false,
              conflict_reason: null as string | null,
              steps:           p.steps,
            }
          }

          // For other tasks that were flex-adjusted, update their steps
          return {
            id:              p.taskId,
            scheduled_start: existingTask.scheduled_start,
            conflict:        false,
            conflict_reason: null as string | null,
            steps:           p.steps,
          }
        }).filter(Boolean) as Array<{
          id: string
          scheduled_start: string | null
          conflict: boolean
          conflict_reason: string | null
          steps: StepData[]
        }>

        await bulkUpdateSchedule(updates)

        if (solverResult.moved && solverResult.message) {
          toast.info(solverResult.message)
        } else {
          toast.success('Template updated')
        }
      } else {
        // Simple move — no intercalation adjustments needed
        await updateTask(taskId, {
          name:            task.name,
          description:     task.description,
          priority:        task.priority,
          placement:       'manual',
          deadline:        task.deadline,
          steps:           solverResult?.placements.find(p => p.taskId === taskId)?.steps ?? task.steps,
          color:           task.color,
          scheduled_start: utc,
        })

        if (solverResult?.moved && solverResult.message) {
          toast.info(solverResult.message)
        } else {
          toast.success('Template updated')
        }
      }

      // If we were in "manual place" mode for this task, exit it after a successful drop.
      if (manualPlaceTaskId === taskId) {
        setManualPlaceTaskId(null)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error updating template')
      throw e
    }
  }

  // ── Calendar event CRUD ──────────────────────────────────────────────────────
  async function handleSave(data: CalendarEventInsert | CalendarEventInsert[]) {
    try {
      if (Array.isArray(data)) {
        // New recurring series created from the modal.
        for (const ev of data) {
          await createEvent(ev)
        }
        toast.success(`${data.length} events created`)
      } else if (editEvent && editEvent.source === 'event') {
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

  // ── Template drag-to-calendar ──────────────────────────────────────────────
  async function handleTemplateDragStart(template: import('./hooks/useTaskTemplates').TaskTemplate) {
    try {
      const taskId = await createTask({
        name:  template.name,
        steps: template.steps,
        color: template.color,
        placement: 'manual',
      })
      setManualPlaceTaskId(taskId)
      setTemplatesPanelOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error placing template')
    }
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
    const weekTaskEvents = buildTaskEventsForWeek(scheduledTaskBlocks, monday)
    downloadIcal([...weekEvts, ...weekTaskEvents], 'sylvy-week.ics')
  }

  function handleOpenGoogleWeek() {
    const weekTaskEvents = buildTaskEventsForWeek(scheduledTaskBlocks, monday)
    const allWeekEvents  = [...weekEvts, ...weekTaskEvents]
    // Trigger download of the .ics (for later import) and open Google Calendar.
    const content = generateIcal(allWeekEvents, 'Sylvy Weekly Planner')
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: 'sylvy-week.ics',
    })
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    window.open('https://calendar.google.com/calendar/u/0/r', '_blank', 'noopener,noreferrer')
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="pl-app flex flex-col overflow-hidden" style={{ height: '100vh' }}>

      {/* Manual placement banner */}
      {manualPlaceTaskId && (
        <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 bg-pl-charcoal text-white z-20">
          <span className="text-[11px] font-[600] font-nb-mono flex-1">
            Drag on the calendar to place the new template
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
          onOpenGoogleWeek={handleOpenGoogleWeek}
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
              pendingTask={pendingTask}
              onEventClick={handleEventClick}
              onEventMove={handleEventMove}
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
              pendingTask={pendingTask}
              onEventClick={handleEventClick}
              onEventMove={handleEventMove}
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

      {/* Floating action: templates */}
      <div className="fixed right-8 bottom-8 z-30 flex flex-col items-end gap-3">
        <button
          onClick={() => { setTemplatesPanelOpen(true) }}
          className="w-11 h-11 rounded-full bg-pl-orange text-white shadow-lg flex items-center justify-center hover:bg-pl-orange-dark transition-colors"
          title="Workflow templates"
        >
          <BookTemplate size={18} />
        </button>
      </div>

      {/* Edit panel (for clicking on scheduled templates) */}
      <TaskPanel
        open={taskPanelOpen}
        task={editTask}
        selectedStepId={selectedStepId}
        templates={templates}
        usedColors={tasks.map(t => t.color).filter(Boolean) as string[]}
        onClose={() => { setTaskPanelOpen(false); setEditTask(null); setSelectedStepId(null) }}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />

      {/* Templates panel */}
      <TemplatesPanel
        open={templatesPanelOpen}
        templates={templates}
        onClose={() => setTemplatesPanelOpen(false)}
        onCreate={createTemplateDistinct}
        onUpdate={updateTemplate}
        onDelete={deleteTemplate}
        onTemplateDragStart={handleTemplateDragStart}
      />

      {/* Event modal (edit existing calendar events only) */}
      <EventModal
        open={modalOpen}
        event={editEvent}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => { setModalOpen(false); setEditEvent(null) }}
      />

    </div>
  )
}
