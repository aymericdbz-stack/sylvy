'use client'

import { useRef, useEffect, useState, useMemo, useCallback, Fragment } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import type { CalendarEvent } from '../types'
import TaskBlock from './TaskBlock'
import type { ScheduledTaskBlock } from './TaskBlock'
import { getTimezone } from '@/lib/preferences'
import { solveIntercalation } from '../engine/solveIntercalation'
import type { IntercalationResult, TaskPlacement } from '../engine/solveIntercalation'
import type { StepData, PlannerTask } from '../hooks/usePlannerTasks'

// ── Constants ─────────────────────────────────────────────────────────────────
const PX_PER_HOUR_DEFAULT = 52
const DAY_START = 0
const DAY_END = 24
const DAY_START_MIN = DAY_START * 60
const DAY_END_MIN = DAY_END * 60
/** Grid snap for task drag (minutes). 5 = smooth 5-min steps; no quarter-hour jump. */
/** Snap for task/event drag: 1 = land exactly where the pointer is (to the minute). */
const SNAP_MINUTES = 1

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── Event colors ──────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  orange: { bg: '#FFF7ED', border: '#F97316', text: '#9A3412' },
  green:  { bg: '#F0FDF4', border: '#4CAF7D', text: '#14532D' },
  blue:   { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
  purple: { bg: '#F5F3FF', border: '#8B5CF6', text: '#4C1D95' },
  red:    { bg: '#FEF2F2', border: '#EF4444', text: '#7F1D1D' },
  teal:   { bg: '#F0FDFA', border: '#14B8A6', text: '#134E4A' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeToMin(iso: string, tz?: string): number {
  const d = new Date(iso)
  if (!tz) return d.getHours() * 60 + d.getMinutes()
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZone: tz,
  }).formatToParts(d)
  let h = parseInt(parts.find(p => p.type === 'hour')!.value)
  const m = parseInt(parts.find(p => p.type === 'minute')!.value)
  if (h === 24) h = 0
  return h * 60 + m
}

function evLocalDate(iso: string, tz: string): string {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}`
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function minToLabel(min: number): string {
  let h = Math.floor(min / 60)
  const m = min % 60
  if (h === 24) h = 0
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function minToHHMM(min: number): string {
  let h = Math.floor(min / 60)
  const m = min % 60
  if (h === 24) h = 0
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

type DayEventSegment = {
  event: CalendarEvent
  startMin: number
  endMin: number
}

// Greedy column layout for planner tasks within a single day — only split
// horizontally when their visible time ranges actually overlap.
function assignTaskColumns(
  tasksForDay: { block: ScheduledTaskBlock; dayOffset: number }[],
): { colMap: Map<string, number>; maxCols: number } {
  type Item = { key: string; start: number; end: number }
  const items: Item[] = []

  for (const { block: tb, dayOffset } of tasksForDay) {
    const steps = tb.task.steps as import('../hooks/usePlannerTasks').StepData[]
    if (!steps.length) continue

    const taskStartMin =
      tb.scheduledStart.getHours() * 60 + tb.scheduledStart.getMinutes()
    const lastStepEnd = steps.reduce(
      (acc, s) => Math.max(acc, s.startOffset + (s.scheduledDuration ?? s.duration)),
      0,
    )

    const absStart = taskStartMin
    const absEnd   = taskStartMin + lastStepEnd
    const dayAbsStart = dayOffset
    const dayAbsEnd   = dayOffset + DAY_END_MIN

    const visStartAbs = Math.max(absStart, dayAbsStart)
    const visEndAbs   = Math.min(absEnd, dayAbsEnd)
    if (visEndAbs <= visStartAbs) continue

    const start = visStartAbs - dayOffset
    const end   = visEndAbs - dayOffset
    const key   = `${tb.task.id}-${dayOffset}`
    items.push({ key, start, end })
  }

  if (!items.length) return { colMap: new Map(), maxCols: 1 }

  items.sort((a, b) => a.start - b.start || a.end - b.end)

  const colEnds: number[] = []
  const colMap  = new Map<string, number>()

  for (const it of items) {
    let col = colEnds.findIndex(e => e <= it.start)
    if (col === -1) {
      col = colEnds.length
      colEnds.push(it.end)
    } else {
      colEnds[col] = it.end
    }
    colMap.set(it.key, col)
  }

  return { colMap, maxCols: Math.max(colEnds.length, 1) }
}

// ── EventBlock ────────────────────────────────────────────────────────────────
function EventBlock({
  event,
  top,
  height,
  onClick,
  onMouseDown,
}: {
  event: CalendarEvent
  top: number
  height: number
  onClick: (e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
}) {
  const style = COLOR_MAP[event.color] ?? COLOR_MAP.orange
  const isTiny = height < 28
  const isSmall = height < 44

  const sTime = new Date(event.start_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const eTime = new Date(event.end_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div
      className="absolute left-[2px] right-[2px] rounded-[4px] overflow-hidden cursor-pointer select-none z-10 transition-opacity hover:opacity-90"
      onMouseDown={onMouseDown}
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 18)}px`,
        backgroundColor: style.bg,
        border: `1px solid ${style.border}33`,
        borderLeft: `2.5px solid ${style.border}`,
      }}
      onClick={onClick}
    >
      <div className={`h-full flex ${isTiny ? 'items-center px-1.5' : 'flex-col px-1.5 py-1'} gap-0.5`}>
        <span
          className="font-[600] truncate leading-tight font-nb-mono"
          style={{ color: style.text, fontSize: isTiny ? '9px' : '10px' }}
        >
          {event.title}
        </span>
        {!isTiny && !isSmall && (
          <span className="text-[9px] font-nb-mono whitespace-nowrap leading-none" style={{ color: style.border }}>
            {sTime} – {eTime}
          </span>
        )}
        {!isTiny && isSmall && (
          <span className="text-[9px] font-nb-mono whitespace-nowrap leading-none" style={{ color: style.border }}>
            {sTime}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface DayCalendarProps {
  date: Date
  events: CalendarEvent[]
  scheduledTasks?: ScheduledTaskBlock[]
  /** Unscheduled task that is being manually placed via drag-to-drop. */
  pendingTask?: PlannerTask | null
  onEventClick: (event: CalendarEvent) => void
  onEventMove?: (eventId: string, date: string, startTime: string, endTime: string, endDate?: string) => void | Promise<void>
  onSlotClick: (date: string, time: string, endTime?: string) => void
  onTaskClick?: (task: import('../hooks/usePlannerTasks').PlannerTask, stepId?: string) => void
  workStartHour: number
  workEndHour: number
  onTaskMove?: (taskId: string, date: string, time: string, solverResult?: IntercalationResult) => void | Promise<void>
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DayCalendar({
  date,
  events,
  scheduledTasks = [],
  pendingTask = null,
  onEventClick,
  onEventMove,
  onSlotClick,
  onTaskClick,
  workStartHour,
  workEndHour,
  onTaskMove,
}: DayCalendarProps) {
  const dayISO = toISO(date)
  const todayISO = toISO(new Date())
  const scrollRef = useRef<HTMLDivElement>(null)
  const [tz, setTz] = useState<string>(() => getTimezone())
  const [nowMin, setNowMin] = useState(() => {
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
  })
  const [pxPerHour, setPxPerHour] = useState(PX_PER_HOUR_DEFAULT)
  const pxPerHourRef = useRef(pxPerHour)

  const PX_PER_MIN = pxPerHour / 60
  const CAL_HEIGHT = (DAY_END_MIN - DAY_START_MIN) * PX_PER_MIN

  const gutterDragRef = useRef<{ startY: number; startPxPerHour: number } | null>(null)

  const dragRef = useRef<{ dayISO: string; anchorMin: number } | null>(null)
  const onSlotRef = useRef(onSlotClick)
  useEffect(() => {
    onSlotRef.current = onSlotClick
  }, [onSlotClick])
  const [dragPreview, setDragPreview] = useState<{ startMin: number; endMin: number } | null>(null)
  const dragPreviewRef = useRef<{ startMin: number; endMin: number } | null>(null)

  useEffect(() => {
    const handler = () => setTz(getTimezone())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])
  useEffect(() => {
    pxPerHourRef.current = pxPerHour
  }, [pxPerHour])

  // Trackpad pinch-to-zoom (Safari gesture and ctrl+wheel) — adjust vertical scale instead of page zoom
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const BASE_ZOOM_MIN = 26
    let zoomMin = BASE_ZOOM_MIN
    const zoomMax = 156

    function clampZoom(v: number) {
      return Math.max(zoomMin, Math.min(zoomMax, v))
    }

    // Ensure that at full zoom-out, the 0–24h grid fills (at least) the viewport
    function syncZoomMinToViewport() {
      const viewH = el!.clientHeight || 0
      if (!viewH) return
      const minFromViewport = viewH / (DAY_END - DAY_START) // px per hour so that 24h fits
      zoomMin = Math.max(BASE_ZOOM_MIN, minFromViewport)

      const current = pxPerHourRef.current || PX_PER_HOUR_DEFAULT
      const clamped = clampZoom(current)
      if (clamped !== current) {
        pxPerHourRef.current = clamped
        setPxPerHour(clamped)
      }
    }

    function applyZoom(nextPxPerHour: number, clientY: number) {
      const container = el!
      const rect = container.getBoundingClientRect()
      const y = clientY - rect.top
      const prevPxPerHour = pxPerHourRef.current || PX_PER_HOUR_DEFAULT
      const prevScrollTop = container.scrollTop
      const scale = nextPxPerHour / prevPxPerHour

      // keep the point under the cursor fixed
      const newScrollTop = (prevScrollTop + y) * scale - y
      container.scrollTop = newScrollTop

      pxPerHourRef.current = nextPxPerHour
      setPxPerHour(nextPxPerHour)
    }

    // Smooth zoom animation state
    let zoomAnimId: number | null = null
    let zoomFrom = pxPerHourRef.current || PX_PER_HOUR_DEFAULT
    let zoomTo = zoomFrom
    let zoomStart = 0
    const ZOOM_ANIM_DURATION = 140 // ms

    function startZoomAnimation(targetPxPerHour: number, clientY: number) {
      const from = pxPerHourRef.current || PX_PER_HOUR_DEFAULT
      zoomFrom = from
      zoomTo = targetPxPerHour
      zoomStart = performance.now()
      if (zoomAnimId != null) {
        cancelAnimationFrame(zoomAnimId)
      }

      function step() {
        const t = Math.min(1, (performance.now() - zoomStart) / ZOOM_ANIM_DURATION)
        const eased = 1 - (1 - t) * (1 - t) // easeOutQuad
        const current = zoomFrom + (zoomTo - zoomFrom) * eased
        applyZoom(current, clientY)
        if (t < 1) {
          zoomAnimId = requestAnimationFrame(step)
        } else {
          zoomAnimId = null
        }
      }

      zoomAnimId = requestAnimationFrame(step)
    }

    // Coalesce rapid wheel events into a single frame to avoid jitter
    let wheelDeltaAccum = 0
    let wheelRafId: number | null = null
    let lastClientY = 0

    function flushWheelZoom() {
      wheelRafId = null
      const deltaY = wheelDeltaAccum
      wheelDeltaAccum = 0
      if (!deltaY) return

      const zoomIntensity = 0.016 // 2x sensitivity, still animated for smoothness
      const factor = Math.exp(-deltaY * zoomIntensity)
      const prev = pxPerHourRef.current || PX_PER_HOUR_DEFAULT
      const next = clampZoom(prev * factor)
      if (next === prev) return
      startZoomAnimation(next, lastClientY)
    }

    function onWheel(e: WheelEvent) {
      // Only handle pinch gestures that some browsers expose as ctrl+wheel
      if (!e.ctrlKey) return
      e.preventDefault()

      wheelDeltaAccum += e.deltaY
      lastClientY = e.clientY
      if (wheelRafId == null) {
        wheelRafId = requestAnimationFrame(flushWheelZoom)
      }
    }

    // Safari / WebKit: gesture* events for trackpad pinch
    let gestureBase: number | null = null

    function onGestureStart(e: any) {
      e.preventDefault()
      gestureBase = pxPerHourRef.current
    }
    function onGestureChange(e: any) {
      if (gestureBase == null) return
      e.preventDefault()
      const scale = typeof e.scale === 'number' ? e.scale : 1
      const next = clampZoom(gestureBase * scale)
      if (!next) return
      const centerY = e.clientY ?? (el!.getBoundingClientRect().top + el!.clientHeight / 2)
      startZoomAnimation(next, centerY)
    }
    function onGestureEnd(e: any) {
      e.preventDefault()
      gestureBase = null
    }

    // Initial sync so full zoom-out stops at "fit 24h to viewport"
    syncZoomMinToViewport()
    const onResize = () => syncZoomMinToViewport()
    window.addEventListener('resize', onResize)

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('gesturestart', onGestureStart as EventListener, { passive: false })
    el.addEventListener('gesturechange', onGestureChange as EventListener, { passive: false })
    el.addEventListener('gestureend', onGestureEnd as EventListener, { passive: false })

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('gesturestart', onGestureStart as EventListener)
      el.removeEventListener('gesturechange', onGestureChange as EventListener)
      el.removeEventListener('gestureend', onGestureEnd as EventListener)
      if (wheelRafId != null) cancelAnimationFrame(wheelRafId)
      if (zoomAnimId != null) cancelAnimationFrame(zoomAnimId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Scroll near "now" on mount
  useEffect(() => {
    const target = scrollRef.current
    if (!target) return
    const scrollTo = Math.max(0, (nowMin - 60 - DAY_START_MIN) * PX_PER_MIN)
    target.scrollTop = scrollTo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date()
      setNowMin(n.getHours() * 60 + n.getMinutes())
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  const eventsForDay = useMemo<DayEventSegment[]>(() => {
    const segments: DayEventSegment[] = []

    for (const ev of events) {
      const startDateISO = evLocalDate(ev.start_at, tz)
      const endDateISO   = evLocalDate(ev.end_at,   tz)
      const startMin     = timeToMin(ev.start_at, tz)
      const endMin       = timeToMin(ev.end_at,   tz)

      function addSegment(dateISO: string, segStart: number, segEnd: number) {
        if (dateISO !== dayISO) return

        let s = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, segStart))
        let e = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, segEnd))
        if (e <= s) return

        segments.push({
          event: ev,
          startMin: s,
          endMin:   e,
        })
      }

      if (startDateISO === endDateISO) {
        addSegment(startDateISO, startMin, endMin)
        continue
      }

      // First day: from actual start time until midnight
      addSegment(startDateISO, startMin, DAY_END_MIN)

      // Intermediate full days (if any)
      const startDate = new Date(`${startDateISO}T00:00:00`)
      const endDate   = new Date(`${endDateISO}T00:00:00`)
      for (
        let d = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        d.getTime() < endDate.getTime();
        d.setDate(d.getDate() + 1)
      ) {
        addSegment(toISO(d), DAY_START_MIN, DAY_END_MIN)
      }

      // Last day: from midnight until actual end time
      addSegment(endDateISO, DAY_START_MIN, endMin)
    }

    return segments
  }, [events, tz, dayISO])

  const tasksForDay = useMemo(() => {
    const map = new Map<string, { block: ScheduledTaskBlock; dayOffset: number }[]>()
    for (const tb of scheduledTasks) {
      const key = toISO(tb.scheduledStart)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({ block: tb, dayOffset: 0 })

      const startMin = tb.scheduledStart.getHours() * 60 + tb.scheduledStart.getMinutes()
      const lastStep = tb.task.steps.reduce((acc, s) => Math.max(acc, s.startOffset + s.duration), 0)
      if (startMin + lastStep > 1440) {
        const nextDay = new Date(tb.scheduledStart)
        nextDay.setDate(nextDay.getDate() + 1)
        const nextKey = toISO(nextDay)
        if (!map.has(nextKey)) map.set(nextKey, [])
        map.get(nextKey)!.push({ block: tb, dayOffset: 1440 })
      }
    }
    return map.get(dayISO) ?? []
  }, [scheduledTasks, dayISO])

  const hourMarks: number[] = []
  for (let m = DAY_START_MIN; m <= DAY_END_MIN; m += 60) hourMarks.push(m)

  const nowTop = (nowMin - DAY_START_MIN) * PX_PER_MIN
  const showNow = nowMin >= DAY_START_MIN && nowMin <= DAY_END_MIN && todayISO === dayISO

  const workStartMin = workStartHour * 60
  const workEndMin = workEndHour * 60

  const clientYToMinRef = useRef<(clientY: number) => number>(null!)
  clientYToMinRef.current = (clientY: number): number => {
    const container = scrollRef.current
    if (!container) return DAY_START_MIN
    const rect = container.getBoundingClientRect()
    const y = clientY - rect.top + container.scrollTop
    const min = Math.round(y / PX_PER_MIN / SNAP_MINUTES) * SNAP_MINUTES + DAY_START_MIN
    return Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, min))
  }

  // Drag-to-move for task templates
  const taskDragRef = useRef<{
    taskId:           string
    originClientX:    number
    originClientY:    number
    pointerOffsetMin: number
    durationMin:      number
    originalStartMin: number
    hasStarted:       boolean
  } | null>(null)
  const [taskDragPreview, setTaskDragPreview] = useState<{
    taskId:   string
    startMin: number
    endMin:   number
  } | null>(null)
  /** After drop: keep task visually at drop position until parent state has new position (avoids jerk). */
  const [committedDrop, setCommittedDrop] = useState<{
    taskId: string
    startMin: number
    dayISO: string
  } | null>(null)
  const [showDragLabels, setShowDragLabels] = useState(false)
  const showDragLabelsRef = useRef(false)
  const taskDragPreviewRef = useRef<typeof taskDragPreview | null>(null)
  useEffect(() => {
    taskDragPreviewRef.current = taskDragPreview
  }, [taskDragPreview])

  // Drag-to-place for a newly created (unscheduled) task.
  const pendingDragRef = useRef<{
    taskId:        string
    originClientX: number
    originClientY: number
    anchorMin:     number
    durationMin:   number
    hasStarted:    boolean
  } | null>(null)
  const [pendingDragPreview, setPendingDragPreview] = useState<{
    taskId:   string
    startMin: number
    endMin:   number
  } | null>(null)
  const [showPendingDragLabels, setShowPendingDragLabels] = useState(false)
  const showPendingDragLabelsRef = useRef(false)
  const pendingDragPreviewRef = useRef<typeof pendingDragPreview | null>(null)
  useEffect(() => {
    pendingDragPreviewRef.current = pendingDragPreview
  }, [pendingDragPreview])

  const onTaskMoveRef = useRef(onTaskMove)
  useEffect(() => {
    onTaskMoveRef.current = onTaskMove
  }, [onTaskMove])
  const onTaskClickRef = useRef(onTaskClick)
  useEffect(() => {
    onTaskClickRef.current = onTaskClick
  }, [onTaskClick])
  const onEventMoveRef = useRef(onEventMove)
  useEffect(() => {
    onEventMoveRef.current = onEventMove
  }, [onEventMove])
  const onEventClickRef = useRef(onEventClick)
  useEffect(() => {
    onEventClickRef.current = onEventClick
  }, [onEventClick])
  const eventsRef = useRef(events)
  useEffect(() => {
    eventsRef.current = events
  }, [events])

  const eventDragRef = useRef<{
    eventId:           string
    originClientX:     number
    originClientY:     number
    pointerOffsetMin:  number
    durationMin:       number
    originalStartMin:  number
    hasStarted:        boolean
  } | null>(null)
  const [eventDragPreview, setEventDragPreview] = useState<{ eventId: string; startMin: number; endMin: number } | null>(null)
  const eventDragPreviewRef = useRef<typeof eventDragPreview | null>(null)
  useEffect(() => {
    eventDragPreviewRef.current = eventDragPreview
  }, [eventDragPreview])

  const pendingTaskRef = useRef<PlannerTask | null>(pendingTask)
  useEffect(() => { pendingTaskRef.current = pendingTask }, [pendingTask])

  // Refs for intercalation solver inputs (avoid stale closures in mousemove)
  const scheduledTasksRef = useRef(scheduledTasks)
  useEffect(() => { scheduledTasksRef.current = scheduledTasks }, [scheduledTasks])
  const workHoursRef = useRef({ start: workStartHour, end: workEndHour })
  useEffect(() => { workHoursRef.current = { start: workStartHour, end: workEndHour } }, [workStartHour, workEndHour])

  // Intercalation preview during drag — overrides task positions
  const [intercalationPreview, setIntercalationPreview] = useState<IntercalationResult | null>(null)
  const intercalationPreviewRef = useRef<IntercalationResult | null>(null)
  useEffect(() => { intercalationPreviewRef.current = intercalationPreview }, [intercalationPreview])

  const dayColumnRef = useRef<HTMLDivElement>(null)
  const taskBlocksForHitTestRef = useRef<{ block: ScheduledTaskBlock; dayOffset: number }[]>([])

  function computeDurationMin(steps: StepData[]): number {
    return steps.reduce((acc, s) => Math.max(acc, s.startOffset + (s.scheduledDuration ?? s.duration)), 0)
  }

  function handleColMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    const anchorMin = clientYToMinRef.current(e.clientY)

    if (pendingTask) {
      const durationMin = computeDurationMin(pendingTask.steps as StepData[])
      pendingDragRef.current = {
        taskId:      pendingTask.id,
        originClientX: e.clientX,
        originClientY: e.clientY,
        anchorMin,
        durationMin,
        hasStarted: false,
      }

      const startMin = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - durationMin, anchorMin))
      setPendingDragPreview({
        taskId: pendingTask.id,
        startMin,
        endMin: startMin + durationMin,
      })
      pendingDragPreviewRef.current = {
        taskId: pendingTask.id,
        startMin,
        endMin: startMin + durationMin,
      }
      return
    }

    dragRef.current = { dayISO, anchorMin }
    const preview = { startMin: anchorMin, endMin: anchorMin + 15 }
    dragPreviewRef.current = preview
    setDragPreview(preview)
  }

  function handleTaskMouseDown(e: React.MouseEvent, tb: ScheduledTaskBlock) {
    if (e.button !== 0) return
    e.preventDefault()
    const startMin = tb.scheduledStart.getHours() * 60 + tb.scheduledStart.getMinutes()
    const pointerMin = clientYToMinRef.current(e.clientY)
    const lastStep = tb.task.steps.reduce(
      (acc, s) => Math.max(acc, s.startOffset + (s.scheduledDuration ?? s.duration)),
      0,
    )
    const durationMin = lastStep
    const pointerOffsetMin = pointerMin - startMin
    taskDragRef.current = {
      taskId:           tb.task.id,
      originClientX:    e.clientX,
      originClientY:    e.clientY,
      pointerOffsetMin,
      durationMin,
      originalStartMin: startMin,
      hasStarted:       false,
    }
  }

  // Capture-phase hit-test: drag the template whose block is topmost at the cursor.
  // Don't preventDefault so that a simple click still fires and can open the edit panel.
  function handleDayColumnMouseDownCapture(e: React.MouseEvent) {
    if (e.button !== 0) return
    const col = dayColumnRef.current
    if (!col) return
    const elements = document.elementsFromPoint(e.clientX, e.clientY)
    const taskCandidates = elements.filter(
      (el): el is HTMLElement => {
        const id = el.getAttribute?.('data-task-id')
        return !!id && col.contains(el)
      },
    )
    if (taskCandidates.length === 0) return
    // Pick the topmost by computed z-index (short tasks have higher zBoost → higher z-index)
    const taskEl = taskCandidates.reduce((top, el) => {
      const topZ = parseInt(getComputedStyle(top).zIndex, 10) || 0
      const elZ = parseInt(getComputedStyle(el).zIndex, 10) || 0
      return elZ > topZ ? el : top
    })
    const taskId = taskEl.getAttribute('data-task-id')
    if (!taskId) return
    const entry = taskBlocksForHitTestRef.current.find(
      entry => entry.block.task.id === taskId && entry.dayOffset === 0,
    )
    if (!entry) return
    e.stopPropagation()
    e.preventDefault()
    handleTaskMouseDown(e, entry.block)
  }

  function handleEventMouseDown(
    e: React.MouseEvent,
    event: CalendarEvent,
    segStartMin: number,
    segEndMin: number,
  ) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const pointerMin = clientYToMinRef.current(e.clientY)
    const durationMin = Math.round(
      (new Date(event.end_at).getTime() - new Date(event.start_at).getTime()) / 60_000,
    )
    const pointerOffsetMin = pointerMin - segStartMin
    eventDragRef.current = {
      eventId:          event.id,
      originClientX:    e.clientX,
      originClientY:    e.clientY,
      pointerOffsetMin,
      durationMin,
      originalStartMin: segStartMin,
      hasStarted:       false,
    }
    const startMin = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - durationMin, segStartMin))
    const preview = { eventId: event.id, startMin, endMin: startMin + durationMin }
    eventDragPreviewRef.current = preview
    setEventDragPreview(preview)
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (dragRef.current) {
        const { anchorMin } = dragRef.current
        const currentMin = clientYToMinRef.current(e.clientY)
        const endMin = Math.max(currentMin, anchorMin + 15)
        const preview = { startMin: anchorMin, endMin }
        dragPreviewRef.current = preview
        setDragPreview(preview)
      }

      if (pendingDragRef.current) {
        const t = pendingDragRef.current
        const pending = pendingTaskRef.current
        if (!pending) return

        const pointerMin = clientYToMinRef.current(e.clientY)

        if (!t.hasStarted) {
          const dx = e.clientX - t.originClientX
          const dy = e.clientY - t.originClientY
          const movedEnough = Math.hypot(dx, dy) >= 4
          if (!movedEnough) {
            return
          }
          t.hasStarted = true
          if (!showPendingDragLabelsRef.current) {
            showPendingDragLabelsRef.current = true
            setShowPendingDragLabels(true)
          }
        }

        let startMin = pointerMin
        startMin = Math.round(startMin / SNAP_MINUTES) * SNAP_MINUTES
        startMin = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - t.durationMin, startMin))

        // Run intercalation solver (day view = same-day only)
        const allTasks = scheduledTasksRef.current
        const existingTasks: TaskPlacement[] = allTasks.map(tb => ({
          taskId: tb.task.id,
          startMin: tb.scheduledStart.getHours() * 60 + tb.scheduledStart.getMinutes(),
          steps: tb.task.steps as StepData[],
        }))

        const result = solveIntercalation({
          existingTasks,
          newTask: {
            taskId: t.taskId,
            startMin,
            steps: pending.steps as StepData[],
          },
          workHours: workHoursRef.current,
        })

        setIntercalationPreview(result)
        intercalationPreviewRef.current = result

        // Keep preview at cursor position — do NOT override with solver (no lag)
        const preview = {
          taskId: t.taskId,
          startMin,
          endMin: startMin + t.durationMin,
        }
        setPendingDragPreview(preview)
        pendingDragPreviewRef.current = preview
      }

      if (taskDragRef.current) {
        const t = taskDragRef.current
        const pointerMin = clientYToMinRef.current(e.clientY)

        // Start dragging only after clear pointer movement (so a normal click opens edit panel).
        if (!t.hasStarted) {
          const dx = e.clientX - t.originClientX
          const dy = e.clientY - t.originClientY
          const movedEnough = Math.hypot(dx, dy) >= 10
          if (!movedEnough) {
            return
          }
          t.hasStarted = true
          if (!showDragLabelsRef.current) {
            showDragLabelsRef.current = true
            setShowDragLabels(true)
          }
        }

        let startMin = pointerMin - t.pointerOffsetMin
        startMin = Math.round(startMin / SNAP_MINUTES) * SNAP_MINUTES
        startMin = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - t.durationMin, startMin))

        // Run intercalation solver
        const allTasks = scheduledTasksRef.current
        const draggedTask = allTasks.find(tb => tb.task.id === t.taskId)
        if (draggedTask) {
          const existingTasks: TaskPlacement[] = allTasks
            .filter(tb => tb.task.id !== t.taskId)
            .map(tb => ({
              taskId: tb.task.id,
              startMin: tb.scheduledStart.getHours() * 60 + tb.scheduledStart.getMinutes(),
              steps: tb.task.steps as StepData[],
            }))

          const result = solveIntercalation({
            existingTasks,
            newTask: {
              taskId: t.taskId,
              startMin,
              steps: draggedTask.task.steps as StepData[],
            },
            workHours: workHoursRef.current,
          })

          setIntercalationPreview(result)
          intercalationPreviewRef.current = result

          // Keep preview at cursor position — do NOT override with solver (no lag)
        }

        const preview = {
          taskId: t.taskId,
          startMin,
          endMin: startMin + t.durationMin,
        }
        setTaskDragPreview(preview)
        taskDragPreviewRef.current = preview
      }

      if (eventDragRef.current) {
        const t = eventDragRef.current
        const pointerMin = clientYToMinRef.current(e.clientY)
        if (!t.hasStarted) {
          const dx = e.clientX - t.originClientX
          const dy = e.clientY - t.originClientY
          if (Math.hypot(dx, dy) < 2) return
          t.hasStarted = true
        }
        let startMin = pointerMin - t.pointerOffsetMin
        startMin = Math.round(startMin / SNAP_MINUTES) * SNAP_MINUTES
        startMin = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - t.durationMin, startMin))
        const preview = { eventId: t.eventId, startMin, endMin: startMin + t.durationMin }
        setEventDragPreview(preview)
        eventDragPreviewRef.current = preview
      }
    }

    function onMouseUp() {
      const d = dragRef.current
      if (d) {
        dragRef.current = null
        const prev = dragPreviewRef.current
        dragPreviewRef.current = null
        setDragPreview(null)
        if (prev) {
          if (prev.endMin - prev.startMin >= 30) {
            onSlotRef.current(d.dayISO, minToHHMM(prev.startMin), minToHHMM(prev.endMin))
          } else {
            onSlotRef.current(d.dayISO, minToHHMM(prev.startMin))
          }
        }
      }

      const t = taskDragRef.current
      const taskMoveCb = onTaskMoveRef.current
      const taskClickCb = onTaskClickRef.current

      const p = pendingDragRef.current
      if (p) {
        pendingDragRef.current = null
        showPendingDragLabelsRef.current = false
        setShowPendingDragLabels(false)
        const pending = pendingTaskRef.current
        const prev = pendingDragPreviewRef.current
        const solverResult = intercalationPreviewRef.current

        const startMin = prev?.startMin ?? Math.max(
          DAY_START_MIN,
          Math.min(DAY_END_MIN - p.durationMin, Math.round(p.anchorMin / SNAP_MINUTES) * SNAP_MINUTES),
        )

        if (pending && taskMoveCb) {
          const res = taskMoveCb(p.taskId, dayISO, minToHHMM(startMin), solverResult ?? undefined)
          if (res && typeof (res as any).catch === 'function') {
            ;(res as Promise<void>).catch(() => {
              pendingDragPreviewRef.current = null
              setPendingDragPreview(null)
              showPendingDragLabelsRef.current = false
              setShowPendingDragLabels(false)
              intercalationPreviewRef.current = null
              setIntercalationPreview(null)
            })
          }
        }

        pendingDragPreviewRef.current = null
        setPendingDragPreview(null)
        showPendingDragLabelsRef.current = false
        setShowPendingDragLabels(false)
        intercalationPreviewRef.current = null
        setIntercalationPreview(null)
      }

      const evDrag = eventDragRef.current
      const eventMoveCb = onEventMoveRef.current
      if (evDrag) {
        eventDragRef.current = null
        const prev = eventDragPreviewRef.current
        eventDragPreviewRef.current = null
        setEventDragPreview(null)
        if (!evDrag.hasStarted) {
          const ev = eventsRef.current.find(e => e.id === evDrag.eventId)
          if (ev) onEventClickRef.current(ev)
        } else if (prev && eventMoveCb) {
          const endMin = prev.startMin + evDrag.durationMin
          let endDate: string | undefined
          let endTime: string
          if (endMin <= DAY_END_MIN) {
            endTime = minToHHMM(endMin)
          } else {
            const nextDay = new Date(date)
            nextDay.setDate(nextDay.getDate() + 1)
            endDate = toISO(nextDay)
            endTime = minToHHMM(endMin - 1440)
          }
          const res = eventMoveCb(evDrag.eventId, dayISO, minToHHMM(prev.startMin), endTime, endDate)
          if (res && typeof (res as Promise<unknown>).catch === 'function') {
            ;(res as Promise<void>).catch(() => {
              eventDragPreviewRef.current = null
              setEventDragPreview(null)
            })
          }
        }
      }

      if (t) {
        taskDragRef.current = null
        const prevTask = taskDragPreviewRef.current
        const solverResult = intercalationPreviewRef.current

        const clearAllPreview = () => {
          taskDragPreviewRef.current = null
          setTaskDragPreview(null)
          showDragLabelsRef.current = false
          setShowDragLabels(false)
          intercalationPreviewRef.current = null
          setIntercalationPreview(null)
        }

        const clearLabelsOnly = () => {
          showDragLabelsRef.current = false
          setShowDragLabels(false)
          intercalationPreviewRef.current = null
          setIntercalationPreview(null)
        }

        // No-op drop (same position or within 2 min): treat as click to open edit panel.
        const SAME_POSITION_TOLERANCE_MIN = 2
        const samePosition = prevTask && Math.abs(prevTask.startMin - t.originalStartMin) <= SAME_POSITION_TOLERANCE_MIN
        if (samePosition && taskClickCb) {
          const entry = tasksForDay.find(tb => tb.block.task.id === t.taskId)
          if (entry) taskClickCb(entry.block.task)
          clearAllPreview()
        } else if (prevTask && taskMoveCb) {
          // Ghost followed cursor (no lag during drag).
          // At drop: use solver's corrected position so overlaps are resolved.
          const solvedNew = solverResult?.placements.find(p => p.taskId === t.taskId)
          const start = solvedNew ? solvedNew.startMin : prevTask.startMin
          clearLabelsOnly()
          setCommittedDrop({ taskId: t.taskId, startMin: start, dayISO })
          const res = taskMoveCb(t.taskId, dayISO, minToHHMM(start), solverResult ?? undefined)
          if (res && typeof (res as any).then === 'function') {
            ;(res as Promise<void>).catch(() => {
              // On error, clear everything
              taskDragPreviewRef.current = null
              setTaskDragPreview(null)
              setCommittedDrop(null)
            })
          }
        } else if (taskClickCb) {
          const entry = tasksForDay.find(tb => tb.block.task.id === t.taskId)
          if (entry) taskClickCb(entry.block.task)
          clearAllPreview()
        } else {
          clearAllPreview()
        }
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clear committed-drop override when parent state has the task at the new position (fallback if promise never resolves).
  useEffect(() => {
    const drop = committedDrop
    if (!drop) return

    // Use a small delay to allow optimistic state to propagate before clearing
    const timeoutId = setTimeout(() => {
      const match = scheduledTasks.some(tb => {
        if (tb.task.id !== drop.taskId) return false
        if (!tb.scheduledStart) return false
        const dateIso = toISO(tb.scheduledStart)
        if (dateIso !== drop.dayISO) return false
        const startMin = tb.scheduledStart.getHours() * 60 + tb.scheduledStart.getMinutes()
        return startMin === drop.startMin
      })

      if (match) {
        setCommittedDrop(null)
        setTaskDragPreview(null)
      }
    }, 50) // Small delay to ensure optimistic state has propagated

    return () => clearTimeout(timeoutId)
  }, [scheduledTasks, dayISO, committedDrop])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!gutterDragRef.current) return
      const delta = gutterDragRef.current.startY - e.clientY
      const next = Math.max(26, Math.min(156, gutterDragRef.current.startPxPerHour + delta * 0.6))
      setPxPerHour(next)
    }
    function onMouseUp() {
      gutterDragRef.current = null
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden min-w-[480px]">
      {/* Header */}
      <div className="flex pl-[52px] border-b border-pl-cream-border flex-shrink-0 bg-pl-cream">
        <div className="flex-1 flex flex-col items-center py-2">
          <span className="text-[10px] font-[600] font-nb-mono uppercase tracking-[0.06em] text-pl-muted">
            {DAY_NAMES[date.getDay()]}
          </span>
          <span
            className={`leading-tight mt-0.5 font-nb-mono ${
              dayISO === todayISO
                ? 'w-7 h-7 rounded-full bg-pl-orange text-white flex items-center justify-center text-[14px] font-[700]'
                : 'text-[15px] font-[700] text-pl-muted-light'
            }`}
          >
            {date.getDate()}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex" style={{ minHeight: `${CAL_HEIGHT}px` }}>
          {/* Time gutter */}
          <div
            className="flex-shrink-0 w-[52px] relative bg-pl-cream select-none"
            style={{ height: `${CAL_HEIGHT}px`, cursor: 'ns-resize' }}
            onMouseDown={e => {
              e.preventDefault()
              gutterDragRef.current = { startY: e.clientY, startPxPerHour: pxPerHour }
            }}
          >
            {hourMarks.map(min => (
              <div
                key={min}
                className="absolute right-0 flex justify-end pr-2"
                style={{ top: `${(min - DAY_START_MIN) * PX_PER_MIN - 8}px` }}
              >
                <span className="text-[10px] text-pl-muted-light font-nb-mono leading-none select-none">
                  {minToLabel(min)}
                </span>
              </div>
            ))}
          </div>

          {/* Day column */}
          <div
            ref={dayColumnRef}
            className="flex-1 relative border-l border-pl-cream-border select-none"
            style={{ height: `${CAL_HEIGHT}px`, cursor: dragPreview ? 'ns-resize' : 'crosshair' }}
            onMouseDownCapture={handleDayColumnMouseDownCapture}
            onMouseDown={handleColMouseDown}
          >
            {/* Non-working zones */}
            <div className="absolute inset-0 pointer-events-none z-5">
              <div
                className="absolute left-0 right-0 bg-white/60"
                style={{ top: 0, height: `${(workStartMin - DAY_START_MIN) * PX_PER_MIN}px` }}
              />
              <div
                className="absolute left-0 right-0 bg-white/60"
                style={{ top: `${(workEndMin - DAY_START_MIN) * PX_PER_MIN}px`, height: `${(DAY_END_MIN - workEndMin) * PX_PER_MIN}px` }}
              />
            </div>

            {/* Hour lines */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {hourMarks.map(min => (
                <div
                  key={min}
                  className="absolute left-0 right-0 border-t border-pl-cream-border"
                  style={{ top: `${(min - DAY_START_MIN) * PX_PER_MIN}px` }}
                />
              ))}
              {hourMarks.slice(0, -1).map(min => (
                <div
                  key={`${min}-h`}
                  className="absolute left-0 right-0 border-t border-dashed border-pl-cream-border/50"
                  style={{ top: `${(min - DAY_START_MIN + 30) * PX_PER_MIN}px` }}
                />
              ))}
            </div>

            {/* Now indicator */}
            {showNow && (
              <div
                className="absolute z-20 pointer-events-none flex items-center"
                style={{
                  top: `${nowTop}px`,
                  left: 0,
                  right: 0,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-pl-orange flex-shrink-0 -ml-1" />
                <div className="flex-1 h-[1.5px] bg-pl-orange" />
              </div>
            )}

            {/* Drag preview */}
            {dragPreview && (() => {
              const pxH = Math.max((dragPreview.endMin - dragPreview.startMin) * PX_PER_MIN, 18)
              return (
                <div
                  className="absolute z-20 pointer-events-none rounded-[4px] overflow-hidden"
                  style={{
                    top: `${(dragPreview.startMin - DAY_START_MIN) * PX_PER_MIN}px`,
                    height: `${pxH}px`,
                    left: '2px',
                    right: '2px',
                    backgroundColor: '#F9731622',
                    border: '1.5px solid #F97316',
                  }}
                >
                  <div className="flex flex-col h-full px-1.5 py-0.5 justify-between">
                    <span className="text-[9px] font-[700] text-pl-orange font-nb-mono leading-none">
                      {minToLabel(dragPreview.startMin)}
                    </span>
                    {pxH >= 36 && (
                      <span className="text-[9px] font-[600] text-pl-orange/70 font-nb-mono leading-none">
                        {minToLabel(dragPreview.endMin)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Events */}
            {eventsForDay.map(seg => {
              const startMin = Math.max(seg.startMin, DAY_START_MIN)
              const endMin   = Math.min(seg.endMin,   DAY_END_MIN)
              const top      = (startMin - DAY_START_MIN) * PX_PER_MIN
              const height   = Math.max((endMin - startMin) * PX_PER_MIN, 18)
              const isDragged = eventDragPreview?.eventId === seg.event.id
              const ghostTop = eventDragPreview && isDragged
                ? (eventDragPreview.startMin - DAY_START_MIN) * PX_PER_MIN
                : top
              const ghostHeight = eventDragPreview && isDragged
                ? Math.max((eventDragPreview.endMin - eventDragPreview.startMin) * PX_PER_MIN, 18)
                : height

              return (
                <Fragment key={`${seg.event.id}-${startMin}-${endMin}`}>
                  <EventBlock
                    event={seg.event}
                    top={ghostTop}
                    height={ghostHeight}
                    onClick={e => {
                      e.stopPropagation()
                      onEventClick(seg.event)
                    }}
                    onMouseDown={e => e.stopPropagation()}
                  />
                  {onEventMove && !isDragged && (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`Drag ${seg.event.title}`}
                      className="absolute left-[2px] right-[2px] z-[30] cursor-grab active:cursor-grabbing"
                      style={{ top: `${top}px`, height: `${height}px` }}
                      onMouseDown={e => handleEventMouseDown(e, seg.event, startMin, endMin)}
                    />
                  )}
                </Fragment>
              )
            })}

            {/* Tasks — with intercalation overrides during drag */}
            {(() => {
              // Build override map from intercalation preview.
              // For drag previews we only apply solver adjustments visually to the
              // task being moved (or the pending task), and keep existing tasks
              // visually fixed so templates never feel "glued together" while
              // you drag one past another.
              const overrideMap = new Map<string, TaskPlacement>()
              if (intercalationPreview) {
                const focusTaskId =
                  pendingDragPreview?.taskId ??
                  taskDragPreview?.taskId ??
                  null
                for (const p of intercalationPreview.placements) {
                  if (!focusTaskId || p.taskId === focusTaskId) {
                    overrideMap.set(p.taskId, p)
                  }
                }
              }

              // Apply overrides to non-dragged tasks for visual intercalation preview
              let displayTasks = tasksForDay.map(({ block: tb, dayOffset }) => {
                const override = overrideMap.get(tb.task.id)
                if (!override || dayOffset > 0 || (taskDragPreview && taskDragPreview.taskId === tb.task.id)) {
                  return { block: tb, dayOffset }
                }
                // Create modified block with solver-adjusted position and steps
                const adjustedStart = new Date(tb.scheduledStart)
                adjustedStart.setHours(Math.floor(override.startMin / 60), override.startMin % 60, 0, 0)
                return {
                  block: {
                    ...tb,
                    scheduledStart: adjustedStart,
                    task: { ...tb.task, steps: override.steps },
                  },
                  dayOffset,
                }
              })

              // After drop: override moved task position until parent state updates (prevents jerk)
              if (committedDrop && dayISO === committedDrop.dayISO) {
                displayTasks = displayTasks.map(({ block: tb, dayOffset }) => {
                  if (dayOffset !== 0 || tb.task.id !== committedDrop.taskId) return { block: tb, dayOffset }
                  // Pin task at drop position
                  const dropStart = new Date(date)
                  dropStart.setHours(Math.floor(committedDrop.startMin / 60), committedDrop.startMin % 60, 0, 0)
                  return {
                    block: { ...tb, scheduledStart: dropStart },
                    dayOffset,
                  }
                })
              }

              // Stable lane index (0–2) per template for available steps.
              const AVAIL_LANES = 3
              const availLaneMap = new Map<string, number>()
              const primaryTasks = displayTasks
                .filter(({ dayOffset }) => dayOffset === 0)
                .slice()
                .sort((a, b) => {
                  const aStart = a.block.scheduledStart.getTime()
                  const bStart = b.block.scheduledStart.getTime()
                  return aStart - bStart || a.block.task.id.localeCompare(b.block.task.id)
                })
              primaryTasks.forEach(({ block: tb }, index) => {
                const lane = Math.min(index, AVAIL_LANES - 1)
                availLaneMap.set(tb.task.id, lane)
              })

              taskBlocksForHitTestRef.current = displayTasks

              const { colMap: taskColMap, maxCols: taskMaxCols } = assignTaskColumns(displayTasks)

              // zBoost: shorter tasks get higher z so they render on top and can be grabbed
              const zBoostMap = new Map<string, number>()
              const byDuration = primaryTasks.slice().sort((a, b) => {
                const durA = (a.block.task.steps as StepData[]).reduce((m, s) => Math.max(m, s.startOffset + (s.scheduledDuration ?? s.duration)), 0)
                const durB = (b.block.task.steps as StepData[]).reduce((m, s) => Math.max(m, s.startOffset + (s.scheduledDuration ?? s.duration)), 0)
                return durB - durA
              })
              byDuration.forEach(({ block: tb }, i) => { zBoostMap.set(tb.task.id, i * 50) })

              return (
                <>
                  {displayTasks.map(({ block: tb, dayOffset }) => {
                    const dragState = taskDragRef.current
                    const isOriginDragged =
                      dragState &&
                      dragState.taskId === tb.task.id &&
                      dayOffset === 0 &&
                      dragState.hasStarted

                    const taskKey = `${tb.task.id}-${dayOffset}`
                    const taskCol = taskColMap.get(taskKey) ?? 0
                    const boost = zBoostMap.get(tb.task.id) ?? 0

                    // While dragging: do not render the task in the map (ghost is rendered below with same key so drop is smooth)
                    if (isOriginDragged && taskDragPreview && taskDragPreview.taskId === tb.task.id) {
                      return null
                    }

                    return (
                      <TaskBlock
                        key={`${tb.task.id}-${dayOffset}`}
                        block={tb}
                        col={taskCol}
                        maxCols={taskMaxCols}
                        availLaneIndex={availLaneMap.get(tb.task.id) ?? 0}
                        dayOffset={dayOffset}
                        pxPerHour={pxPerHour}
                        onClick={onTaskClick}
                        onMouseDown={dayOffset === 0 ? (e) => handleTaskMouseDown(e, tb) : undefined}
                        zBoost={boost}
                      />
                    )
                  })}

                  {/* Origin placeholder for dragged template — uniform tinted block at previous position */}
                  {taskDragRef.current && taskDragRef.current.hasStarted && (() => {
                    const t = taskDragRef.current
                    const originStart = t.originalStartMin
                    const originEnd   = originStart + t.durationMin
                    const top         = (originStart - DAY_START_MIN) * PX_PER_MIN
                    const height      = Math.max((originEnd - originStart) * PX_PER_MIN, 14)

                    const dragged = tasksForDay.find(({ block }) => block.task.id === t.taskId)?.block
                    const colorHex = dragged?.task.color ?? '#F97316'
                    const parseColor = (hex: string) => {
                      const clean = hex.replace('#', '')
                      const r = parseInt(clean.slice(0, 2), 16) || 249
                      const g = parseInt(clean.slice(2, 4), 16) || 115
                      const b = parseInt(clean.slice(4, 6), 16) || 22
                      return { r, g, b }
                    }
                    const { r, g, b } = parseColor(colorHex)

                    return (
                      <div
                        className="absolute z-10 pointer-events-none rounded-[4px] overflow-hidden"
                        style={{
                          top,
                          height,
                          left:  '3px',
                          right: '3px',
                          backgroundColor: `rgba(${r}, ${g}, ${b}, 0.14)`,
                          border:          `1px solid rgba(${r}, ${g}, ${b}, 0.45)`,
                        }}
                      />
                    )
                  })()}

                  {/* Pending (new) task drag-preview — place by dragging onto the calendar */}
                  {pendingDragPreview && pendingTask && (() => {
                    const solverPlacement = intercalationPreview?.placements.find(
                      p => p.taskId === pendingDragPreview.taskId,
                    )
                    const dragTask: PlannerTask = solverPlacement
                      ? { ...pendingTask, steps: solverPlacement.steps }
                      : pendingTask

                    const startMin = pendingDragPreview.startMin
                    const durMin = computeDurationMin(dragTask.steps as StepData[])
                    const startDate = new Date(date)
                    startDate.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0)

                    const pendingLane = Math.min(availLaneMap.size, 2)

                    return (
                      <TaskBlock
                        key={`pending-${pendingDragPreview.taskId}`}
                        block={{
                          task: dragTask,
                          scheduledStart: startDate,
                          conflict: false,
                        }}
                        col={0}
                        maxCols={1}
                        availLaneIndex={pendingLane}
                        dayOffset={0}
                        pxPerHour={pxPerHour}
                        onClick={onTaskClick}
                        dragTimeLabels={showPendingDragLabels ? {
                          start: minToLabel(startMin),
                          end:   minToLabel(startMin + durMin),
                        } : undefined}
                        isDragGhost
                      />
                    )
                  })()}

                  {/* Full template drag-preview — move the whole block with the cursor */}
                  {taskDragPreview && !(committedDrop?.taskId === taskDragPreview.taskId) && (() => {
                    const draggedIndex = tasksForDay.findIndex(
                      ({ block: tb, dayOffset }) =>
                        tb.task.id === taskDragPreview.taskId && dayOffset === 0,
                    )
                    if (draggedIndex === -1) return null
                    const dragged = tasksForDay[draggedIndex]

                    // Use solver-adjusted steps for the dragged block if available
                    const solverPlacement = intercalationPreview?.placements.find(
                      p => p.taskId === taskDragPreview.taskId,
                    )
                    const dragBlock = solverPlacement
                      ? { ...dragged.block, task: { ...dragged.block.task, steps: solverPlacement.steps } }
                      : dragged.block

                    return (
                      <TaskBlock
                        key={`${dragged.block.task.id}-0`}
                        block={dragBlock}
                        col={0}
                        maxCols={1}
                        availLaneIndex={availLaneMap.get(dragged.block.task.id) ?? 0}
                        dayOffset={0}
                        pxPerHour={pxPerHour}
                        onClick={onTaskClick}
                        dragOverrideStartMin={taskDragPreview.startMin}
                        dragTimeLabels={showDragLabels ? {
                          start: minToLabel(taskDragPreview.startMin),
                          end:   minToLabel(taskDragPreview.endMin),
                        } : undefined}
                        isDragGhost
                      />
                    )
                  })()}
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

