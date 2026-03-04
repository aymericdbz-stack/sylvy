'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import type { CalendarEvent } from '../types'
import TaskBlock from './TaskBlock'
import type { ScheduledTaskBlock } from './TaskBlock'
import { getTimezone } from '@/lib/preferences'
import { solveIntercalation } from '../engine/solveIntercalation'
import type { IntercalationResult, TaskPlacement } from '../engine/solveIntercalation'
import type { StepData, PlannerTask } from '../hooks/usePlannerTasks'

// ── Constants ─────────────────────────────────────────────────────────────────
const PX_PER_HOUR_DEFAULT = 52
const PX_PER_HOUR_MIN     = 26
const PX_PER_HOUR_MAX     = 156
const DAY_START    = 0   // 00:00
const DAY_END      = 24  // 24:00
const DAY_START_MIN = DAY_START * 60
const DAY_END_MIN   = DAY_END   * 60
/** Grid snap for task drag (minutes). 5 = smooth 5-min steps; no quarter-hour jump. */
const SNAP_MINUTES = 5

const DAY_NAMES  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
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
    hour: 'numeric', minute: '2-digit', hour12: false, timeZone: tz,
  }).formatToParts(d)
  let h = parseInt(parts.find(p => p.type === 'hour')!.value)
  const m = parseInt(parts.find(p => p.type === 'minute')!.value)
  if (h === 24) h = 0   // some locales return 24 for midnight with hour12:false
  return h * 60 + m
}

// Local calendar date (YYYY-MM-DD) for a UTC ISO string.
// Using slice(0,10) on a UTC string gives the wrong day for events near midnight
// in UTC-offset timezones, so we format via Intl instead.
function evLocalDate(iso: string, tz: string): string {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}`
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Display label (AM/PM) — used in gutter and drag preview
function minToLabel(min: number): string {
  let h = Math.floor(min / 60)
  const m = min % 60
  if (h === 24) h = 0
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return m === 0
    ? `${h12} ${period}`
    : `${h12}:${String(m).padStart(2, '0')} ${period}`
}

// HH:MM string — used for slot callbacks (EventModal expects this format)
function minToHHMM(min: number): string {
  let h = Math.floor(min / 60)
  const m = min % 60
  if (h === 24) h = 0
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Monday of the given week
export function getMondayOf(d: Date): Date {
  const day = new Date(d)
  const dow = day.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  day.setDate(day.getDate() + diff)
  day.setHours(0, 0, 0, 0)
  return day
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

type DayEventSegment = {
  event: CalendarEvent
  id: string
  startMin: number
  endMin: number
}

// Greedy column layout for overlapping event segments within a single day.
// Works on already-localised minutes-from-midnight so it can handle
// multi-day events that were split into daily slices.
function assignColumns(segments: DayEventSegment[]): { colMap: Map<string, number>; maxCols: number } {
  const sorted = [...segments].sort(
    (a, b) => a.startMin - b.startMin || a.endMin - b.endMin
  )
  const colEnds: number[] = []
  const colMap  = new Map<string, number>()

  for (const seg of sorted) {
    const startMin = seg.startMin
    const endMin   = Math.max(seg.endMin, startMin + 30) // ensure a minimum height for layout
    let col = colEnds.findIndex(e => e <= startMin)
    if (col === -1) { col = colEnds.length; colEnds.push(endMin) }
    else colEnds[col] = endMin
    colMap.set(seg.id, col)
  }

  return { colMap, maxCols: Math.max(colEnds.length, 1) }
}

// Greedy column layout for planner tasks — only split horizontally when their
// visible time ranges within the day actually overlap.
function assignTaskColumns(
  dayTasks: { block: ScheduledTaskBlock; dayOffset: number }[],
): { colMap: Map<string, number>; maxCols: number } {
  type Item = { key: string; start: number; end: number }
  const items: Item[] = []

  for (const { block: tb, dayOffset } of dayTasks) {
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
  event, top, height, col, maxCols, onClick, onMouseDown,
}: {
  event: CalendarEvent
  top: number; height: number; col: number; maxCols: number
  onClick:     (e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
}) {
  const style   = COLOR_MAP[event.color] ?? COLOR_MAP.orange
  const isTiny  = height < 28
  const isSmall = height < 44
  const colW    = 100 / maxCols

  const sTime = new Date(event.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const eTime = new Date(event.end_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <div
      className="absolute rounded-[4px] overflow-hidden cursor-pointer select-none z-10 transition-opacity hover:opacity-90"
      onMouseDown={onMouseDown}
      style={{
        top:         `${top}px`,
        height:      `${Math.max(height, 18)}px`,
        left:        `calc(${col * colW}% + 1px)`,
        width:       `calc(${colW}% - 2px)`,
        backgroundColor: style.bg,
        border:      `1px solid ${style.border}33`,
        borderLeft:  `2.5px solid ${style.border}`,
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
interface WeekCalendarProps {
  weekStart:       Date
  events:          CalendarEvent[]
  scheduledTasks?: ScheduledTaskBlock[]
  /** Unscheduled task that is being manually placed via drag-to-drop. */
  pendingTask?:    PlannerTask | null
  onEventClick:    (event: CalendarEvent) => void
  onSlotClick:     (date: string, time: string, endTime?: string) => void
  onTaskClick?:    (task: import('../hooks/usePlannerTasks').PlannerTask, stepId?: string) => void
  workStartHour:   number
  workEndHour:     number
  includeWeekends?: boolean
  onTaskMove?:     (taskId: string, date: string, time: string, solverResult?: IntercalationResult) => void | Promise<void>
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function WeekCalendar({
  weekStart, events, scheduledTasks = [], onEventClick, onSlotClick, onTaskClick,
  workStartHour, workEndHour, includeWeekends = false, onTaskMove,
  pendingTask = null,
}: WeekCalendarProps) {
  const weekDays   = getWeekDays(weekStart)
  const todayISO   = toISO(new Date())
  const scrollRef  = useRef<HTMLDivElement>(null)
  const [tz, setTz] = useState<string>(() => getTimezone())
  const [nowMin, setNowMin] = useState(() => {
    const n = new Date(); return n.getHours() * 60 + n.getMinutes()
  })
  const [pxPerHour, setPxPerHour] = useState(PX_PER_HOUR_DEFAULT)
  const pxPerHourRef = useRef(pxPerHour)
  const minPxPerHourRef = useRef(PX_PER_HOUR_MIN)

  // Derived from zoom level
  const PX_PER_MIN = pxPerHour / 60
  const CAL_HEIGHT = (DAY_END_MIN - DAY_START_MIN) * PX_PER_MIN

  // Gutter drag-to-zoom state
  const gutterDragRef = useRef<{ startY: number; startPxPerHour: number } | null>(null)

  // Drag-to-create state
  const dragRef     = useRef<{ dayISO: string; dayIdx: number; anchorMin: number } | null>(null)
  const onSlotRef   = useRef(onSlotClick)
  useEffect(() => { onSlotRef.current = onSlotClick }, [onSlotClick])
  const [dragPreview, setDragPreview] = useState<{
    dayIdx: number; startMin: number; endMin: number
  } | null>(null)
  const dragPreviewRef = useRef<{ dayIdx: number; startMin: number; endMin: number } | null>(null)

  // Re-read timezone when user changes it in settings
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

    const BASE_ZOOM_MIN = PX_PER_HOUR_MIN
    let zoomMin = BASE_ZOOM_MIN
    const zoomMax = PX_PER_HOUR_MAX

    function clampZoom(v: number) {
      return Math.max(zoomMin, Math.min(zoomMax, v))
    }

    // Ensure that at full zoom-out, the 0–24h grid fills (at least) the viewport
    function syncZoomMinToViewport() {
      const viewH = el?.clientHeight ?? 0
      if (!viewH) return
      const minFromViewport = viewH / (DAY_END - DAY_START) // px per hour so that 24h fits
      zoomMin = Math.max(BASE_ZOOM_MIN, minFromViewport)
      minPxPerHourRef.current = zoomMin

      const current = pxPerHourRef.current || PX_PER_HOUR_DEFAULT
      const clamped = clampZoom(current)
      if (clamped !== current) {
        pxPerHourRef.current = clamped
        setPxPerHour(clamped)
      }
    }

    function applyZoom(nextPxPerHour: number, clientY: number) {
      const container = scrollRef.current
      if (!container) return

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
      const container = scrollRef.current
      if (!container) return
      const centerY = e.clientY ?? (container.getBoundingClientRect().top + container.clientHeight / 2)
      startZoomAnimation(next, centerY)
    }
    function onGestureEnd(e: any) {
      e.preventDefault()
      gestureBase = null
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('gesturestart', onGestureStart as EventListener, { passive: false })
    el.addEventListener('gesturechange', onGestureChange as EventListener, { passive: false })
    el.addEventListener('gestureend', onGestureEnd as EventListener, { passive: false })

    // Initial sync so full zoom-out stops at "fit 24h to viewport"
    syncZoomMinToViewport()
    const onResize = () => syncZoomMinToViewport()
    window.addEventListener('resize', onResize)

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

  // Scroll to 1 hour before current time on mount
  useEffect(() => {
    const target = scrollRef.current
    if (!target) return
    const scrollTo = Math.max(0, (nowMin - 60 - DAY_START_MIN) * PX_PER_MIN)
    target.scrollTop = scrollTo
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update current time every minute
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes())
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  // Group events by local calendar date (timezone-aware) and split multi-day
  // events into per-day segments so they visually span across days instead of
  // being clamped to their start day only.
  const eventsByDate = useMemo(() => {
    const map = new Map<string, DayEventSegment[]>()

    for (const ev of events) {
      const startDateISO = evLocalDate(ev.start_at, tz)
      const endDateISO   = evLocalDate(ev.end_at,   tz)
      const startMin     = timeToMin(ev.start_at, tz)
      const endMin       = timeToMin(ev.end_at,   tz)

      const startDate = new Date(`${startDateISO}T00:00:00`)
      const endDate   = new Date(`${endDateISO}T00:00:00`)

      // Walk each local calendar day the event touches and create a segment
      // bounded by that day's 00:00–24:00 window.
      for (
        let d = new Date(startDate);
        d.getTime() <= endDate.getTime();
        d.setDate(d.getDate() + 1)
      ) {
        const dayISO = toISO(d)

        let segStartMin = DAY_START_MIN
        let segEndMin   = DAY_END_MIN

        if (dayISO === startDateISO) segStartMin = startMin
        if (dayISO === endDateISO)   segEndMin   = endMin

        segStartMin = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, segStartMin))
        segEndMin   = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, segEndMin))

        if (segEndMin <= segStartMin) continue

        if (!map.has(dayISO)) map.set(dayISO, [])
        map.get(dayISO)!.push({
          event:    ev,
          id:       `${ev.id}-${dayISO}`,
          startMin: segStartMin,
          endMin:   segEndMin,
        })
      }
    }

    return map
  }, [events, tz])

  // Group scheduled tasks by ISO date.
  // If a workflow extends past midnight it is also added to the next day with
  // dayOffset=1440 so TaskBlock can render only the overflow slice.
  const tasksByDate = useMemo(() => {
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
    return map
  }, [scheduledTasks])

  const taskBlockById = useMemo(() => {
    const map = new Map<string, ScheduledTaskBlock>()
    for (const tb of scheduledTasks) {
      if (!map.has(tb.task.id)) map.set(tb.task.id, tb)
    }
    return map
  }, [scheduledTasks])

  const hourMarks: number[] = []
  for (let m = DAY_START_MIN; m <= DAY_END_MIN; m += 60) hourMarks.push(m)

  const nowTop   = (nowMin - DAY_START_MIN) * PX_PER_MIN
  const showNow  = nowMin >= DAY_START_MIN && nowMin <= DAY_END_MIN
  const todayIndex = weekDays.findIndex(d => toISO(d) === todayISO)

  const visibleDayIndexes = includeWeekends ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4]
  const visibleDayCount = visibleDayIndexes.length
  const todayInWeek = todayIndex !== -1 && visibleDayIndexes.includes(todayIndex)

  const workStartMin = workStartHour * 60
  const workEndMin   = workEndHour * 60

  // "Latest ref" pattern — updated every render so effects/callbacks always use
  // the current PX_PER_MIN (avoids stale-closure bugs after HMR or constant changes)
  const clientYToMinRef = useRef<(clientY: number) => number>(null!)
  clientYToMinRef.current = (clientY: number): number => {
    const container = scrollRef.current
    if (!container) return DAY_START_MIN
    const rect = container.getBoundingClientRect()
    const y    = clientY - rect.top + container.scrollTop
    const min  = Math.round(y / PX_PER_MIN / SNAP_MINUTES) * SNAP_MINUTES + DAY_START_MIN
    return Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, min))
  }
  const clientXToDayRef = useRef<(clientX: number) => { dayIdx: number; dayISO: string } | null>(null)
  clientXToDayRef.current = (clientX: number) => {
    const container = scrollRef.current
    if (!container || visibleDayCount === 0) return null

    const rect = container.getBoundingClientRect()
    const GUTTER_WIDTH = 52 // px, matches time gutter width
    const gridLeft  = rect.left + GUTTER_WIDTH
    const gridWidth = rect.width - GUTTER_WIDTH
    if (gridWidth <= 0) return null

    const x = clientX - gridLeft
    const ratio = x / gridWidth
    let col = Math.floor(ratio * visibleDayCount)
    if (Number.isNaN(col)) return null
    col = Math.max(0, Math.min(visibleDayCount - 1, col))

    const dayIdx = visibleDayIndexes[col]
    const dayISO = toISO(weekDays[dayIdx])
    return { dayIdx, dayISO }
  }

  // Drag-to-move for task templates
  const taskDragRef = useRef<{
    taskId:           string
    originDayISO:     string
    originDayIdx:     number
    currentDayISO:    string
    currentDayIdx:    number
    originClientX:    number
    originClientY:    number
    pointerOffsetMin: number
    durationMin:      number
    originalStartMin: number
    hasStarted:       boolean
  } | null>(null)
  const [taskDragPreview, setTaskDragPreview] = useState<{
    taskId:   string
    dayIdx:   number
    startMin: number
    endMin:   number
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
    originDayISO:  string
    originDayIdx:  number
    currentDayISO: string
    currentDayIdx: number
    originClientX: number
    originClientY: number
    anchorMin:     number
    durationMin:   number
    hasStarted:    boolean
  } | null>(null)
  const [pendingDragPreview, setPendingDragPreview] = useState<{
    taskId:   string
    dayIdx:   number
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

  const pendingTaskRef = useRef<PlannerTask | null>(pendingTask)
  useEffect(() => {
    pendingTaskRef.current = pendingTask
  }, [pendingTask])

  // Refs for intercalation solver inputs (avoid stale closures in mousemove)
  const scheduledTasksRef = useRef(scheduledTasks)
  useEffect(() => { scheduledTasksRef.current = scheduledTasks }, [scheduledTasks])
  const workHoursRef = useRef({ start: workStartHour, end: workEndHour })
  useEffect(() => { workHoursRef.current = { start: workStartHour, end: workEndHour } }, [workStartHour, workEndHour])

  // Intercalation preview during drag — overrides task positions
  const [intercalationPreview, setIntercalationPreview] = useState<IntercalationResult | null>(null)
  const intercalationPreviewRef = useRef<IntercalationResult | null>(null)
  useEffect(() => { intercalationPreviewRef.current = intercalationPreview }, [intercalationPreview])

  function computeDurationMin(steps: StepData[]): number {
    return steps.reduce((acc, s) => Math.max(acc, s.startOffset + (s.scheduledDuration ?? s.duration)), 0)
  }

  function handleColMouseDown(e: React.MouseEvent, dayISO: string, dayIdx: number) {
    if (e.button !== 0) return
    e.preventDefault()
    const anchorMin = clientYToMinRef.current(e.clientY)

    // If a newly created task is pending placement, start a drag-to-place interaction
    // instead of the drag-to-create-event interaction.
    if (pendingTask) {
      const durationMin = computeDurationMin(pendingTask.steps as StepData[])
      pendingDragRef.current = {
        taskId:        pendingTask.id,
        originDayISO:  dayISO,
        originDayIdx:  dayIdx,
        currentDayISO: dayISO,
        currentDayIdx: dayIdx,
        originClientX: e.clientX,
        originClientY: e.clientY,
        anchorMin,
        durationMin,
        hasStarted: false,
      }

      const startMin = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - durationMin, anchorMin))
      setPendingDragPreview({
        taskId: pendingTask.id,
        dayIdx,
        startMin,
        endMin: startMin + durationMin,
      })
      pendingDragPreviewRef.current = {
        taskId: pendingTask.id,
        dayIdx,
        startMin,
        endMin: startMin + durationMin,
      }
      return
    }

    dragRef.current = { dayISO, dayIdx, anchorMin }
    // Start with a minimal 15-min block — grows as the user drags
    const preview = { dayIdx, startMin: anchorMin, endMin: anchorMin + 15 }
    dragPreviewRef.current = preview
    setDragPreview(preview)
  }

  function handleTaskMouseDown(
    e: React.MouseEvent,
    tb: ScheduledTaskBlock,
    dayISO: string,
    dayIdx: number,
  ) {
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
      originDayISO:     dayISO,
      originDayIdx:     dayIdx,
      currentDayISO:    dayISO,
      currentDayIdx:    dayIdx,
      originClientX:    e.clientX,
      originClientY:    e.clientY,
      pointerOffsetMin,
      durationMin,
      originalStartMin: startMin,
      hasStarted:       false,
    }
  }

  // Global mouse listeners for drag
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (dragRef.current) {
        const { anchorMin, dayIdx } = dragRef.current
        const currentMin = clientYToMinRef.current(e.clientY)
        // Anchor is always the TOP — extend downward only (like Google Calendar)
        const endMin = Math.max(currentMin, anchorMin + 15)
        const preview = { dayIdx, startMin: anchorMin, endMin }
        dragPreviewRef.current = preview
        setDragPreview(preview)
      }

      if (pendingDragRef.current) {
        const t = pendingDragRef.current
        const pending = pendingTaskRef.current
        if (!pending) return

        const pointerMin = clientYToMinRef.current(e.clientY)
        const dayInfo = clientXToDayRef.current?.(e.clientX)

        if (!t.hasStarted) {
          const horizontalMovedToNewDay = !!dayInfo && dayInfo.dayISO !== t.originDayISO
          const dx = e.clientX - t.originClientX
          const dy = e.clientY - t.originClientY
          const movedEnough = Math.hypot(dx, dy) >= 4
          if (!movedEnough && !horizontalMovedToNewDay) {
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
        let dayIdx = t.currentDayIdx
        let dayISO = t.currentDayISO

        if (dayInfo) {
          dayIdx = dayInfo.dayIdx
          dayISO = dayInfo.dayISO
          t.currentDayIdx = dayIdx
          t.currentDayISO = dayISO
        }

        const allTasks = scheduledTasksRef.current
        const targetDayTasks: TaskPlacement[] = allTasks
          .filter(tb => toISO(tb.scheduledStart) === dayISO)
          .map(tb => ({
            taskId: tb.task.id,
            startMin: tb.scheduledStart.getHours() * 60 + tb.scheduledStart.getMinutes(),
            steps: tb.task.steps as StepData[],
          }))

        const result = solveIntercalation({
          existingTasks: targetDayTasks,
          newTask: {
            taskId: t.taskId,
            startMin,
            steps: pending.steps as StepData[],
          },
          workHours: workHoursRef.current,
        })

        setIntercalationPreview(result)
        intercalationPreviewRef.current = result

        const solvedNew = result.placements.find(p => p.taskId === t.taskId)
        if (solvedNew) {
          startMin = solvedNew.startMin
        }

        const preview = {
          taskId: t.taskId,
          dayIdx,
          startMin,
          endMin: startMin + t.durationMin,
        }
        setPendingDragPreview(preview)
        pendingDragPreviewRef.current = preview
      }

      if (taskDragRef.current) {
        const t = taskDragRef.current
        const pointerMin = clientYToMinRef.current(e.clientY)
        const dayInfo = clientXToDayRef.current?.(e.clientX)

        // Start dragging after a small pointer movement (or day switch).
        // Before that, treat the interaction as a simple click (no ghost / placeholder).
        if (!t.hasStarted) {
          const horizontalMovedToNewDay = !!dayInfo && dayInfo.dayISO !== t.originDayISO
          const dx = e.clientX - t.originClientX
          const dy = e.clientY - t.originClientY
          const movedEnough = Math.hypot(dx, dy) >= 4
          if (!movedEnough && !horizontalMovedToNewDay) {
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
        let dayIdx = t.currentDayIdx
        let dayISO = t.currentDayISO

        if (dayInfo) {
          dayIdx = dayInfo.dayIdx
          dayISO = dayInfo.dayISO
          t.currentDayIdx = dayIdx
          t.currentDayISO = dayISO
        }

        // Run intercalation solver for the target day
        const allTasks = scheduledTasksRef.current
        const draggedTask = allTasks.find(tb => tb.task.id === t.taskId)
        if (draggedTask) {
          // Gather existing tasks on the same target day (excluding the dragged one)
          const targetDayTasks: TaskPlacement[] = allTasks
            .filter(tb => {
              if (tb.task.id === t.taskId) return false
              const tbISO = toISO(tb.scheduledStart)
              return tbISO === dayISO
            })
            .map(tb => ({
              taskId: tb.task.id,
              startMin: tb.scheduledStart.getHours() * 60 + tb.scheduledStart.getMinutes(),
              steps: tb.task.steps as StepData[],
            }))

          const result = solveIntercalation({
            existingTasks: targetDayTasks,
            newTask: {
              taskId: t.taskId,
              startMin,
              steps: draggedTask.task.steps as StepData[],
            },
            workHours: workHoursRef.current,
          })

          setIntercalationPreview(result)
          intercalationPreviewRef.current = result

          // Use solver's position for the dragged task
          const solvedNew = result.placements.find(p => p.taskId === t.taskId)
          if (solvedNew) {
            startMin = solvedNew.startMin
          }
        }

        const preview = {
          taskId: t.taskId,
          dayIdx,
          startMin,
          endMin: startMin + t.durationMin,
        }
        setTaskDragPreview(preview)
        taskDragPreviewRef.current = preview
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
          // ≥ 30 min drag → pass end time; shorter → simple click (default 1h in modal)
          if (prev.endMin - prev.startMin >= 30) {
            onSlotRef.current(d.dayISO, minToHHMM(prev.startMin), minToHHMM(prev.endMin))
          } else {
            onSlotRef.current(d.dayISO, minToHHMM(prev.startMin))
          }
        }
      }

      const p = pendingDragRef.current
      const taskMoveCb = onTaskMoveRef.current
      if (p) {
        pendingDragRef.current = null
        showPendingDragLabelsRef.current = false
        setShowPendingDragLabels(false)
        const pending = pendingTaskRef.current
        const prev = pendingDragPreviewRef.current
        const solverResult = intercalationPreviewRef.current

        // If we never got a mousemove (click without drag), place at the anchor time.
        const startMin = prev?.startMin ?? Math.max(
          DAY_START_MIN,
          Math.min(DAY_END_MIN - p.durationMin, Math.round(p.anchorMin / SNAP_MINUTES) * SNAP_MINUTES),
        )

        if (pending && taskMoveCb) {
          const res = taskMoveCb(p.taskId, p.currentDayISO, minToHHMM(startMin), solverResult ?? undefined)
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

      const t = taskDragRef.current
      const taskClickCb = onTaskClickRef.current
      if (t) {
        taskDragRef.current = null
        // Hide drag-time labels immediately on drop; keep ghost until DB updates.
        showDragLabelsRef.current = false
        setShowDragLabels(false)
        const prevTask = taskDragPreviewRef.current
        const solverResult = intercalationPreviewRef.current

        if (prevTask && taskMoveCb) {
          const start = prevTask.startMin
          // Keep the drag preview in place until the schedule update comes back,
          // to prevent a snap-back jerk between old/new positions.
          const res = taskMoveCb(t.taskId, t.currentDayISO, minToHHMM(start), solverResult ?? undefined)
          if (res && typeof (res as any).catch === 'function') {
            ;(res as Promise<void>).catch(() => {
              taskDragPreviewRef.current = null
              setTaskDragPreview(null)
              showDragLabelsRef.current = false
              setShowDragLabels(false)
              intercalationPreviewRef.current = null
              setIntercalationPreview(null)
            })
          }
        } else if (taskClickCb) {
          // Treat small or zero movement as a click on the task.
          const block = taskBlockById.get(t.taskId)
          if (block) {
            taskClickCb(block.task)
          }
          taskDragPreviewRef.current = null
          setTaskDragPreview(null)
          showDragLabelsRef.current = false
          setShowDragLabels(false)
          intercalationPreviewRef.current = null
          setIntercalationPreview(null)
          return
        } else {
          taskDragPreviewRef.current = null
          setTaskDragPreview(null)
          showDragLabelsRef.current = false
          setShowDragLabels(false)
          intercalationPreviewRef.current = null
          setIntercalationPreview(null)
          return
        }
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clear task drag preview once the underlying scheduled task reflects the
  // new start time (prevents a snap-back between old/new positions).
  useEffect(() => {
    const preview = taskDragPreviewRef.current
    if (!preview) return

    const targetDateIso = toISO(weekDays[preview.dayIdx])

    const match = scheduledTasks.some(tb => {
      if (tb.task.id !== preview.taskId) return false
      if (!tb.scheduledStart) return false
      const dateIso = toISO(tb.scheduledStart)
      if (dateIso !== targetDateIso) return false
      const startMin = tb.scheduledStart.getHours() * 60 + tb.scheduledStart.getMinutes()
      return startMin === preview.startMin
    })

    if (match) {
      taskDragPreviewRef.current = null
      setTaskDragPreview(null)
      showDragLabelsRef.current = false
      setShowDragLabels(false)
      intercalationPreviewRef.current = null
      setIntercalationPreview(null)
    }
  }, [scheduledTasks, weekDays])

  // Gutter drag-to-zoom
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!gutterDragRef.current) return
      const delta = gutterDragRef.current.startY - e.clientY // up = zoom in
      const unclamped = gutterDragRef.current.startPxPerHour + delta * 0.6
      const next = Math.max(minPxPerHourRef.current, Math.min(PX_PER_HOUR_MAX, unclamped))
      pxPerHourRef.current = next
      setPxPerHour(next)
    }
    function onMouseUp() {
      gutterDragRef.current = null
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden min-w-[560px]">

      {/* Day headers — sticky */}
      <div className="flex pl-[52px] border-b border-pl-cream-border flex-shrink-0 bg-pl-cream">
        {visibleDayIndexes.map((dayIdx) => {
          const day = weekDays[dayIdx]
          const iso     = toISO(day)
          const isToday = iso === todayISO
          return (
            <div
              key={dayIdx}
              className={`flex-1 flex flex-col items-center py-2 border-l border-pl-cream-border first:border-l-0 ${isToday ? 'bg-pl-orange/[0.04]' : ''}`}
            >
              <span className={`text-[10px] font-[600] font-nb-mono uppercase tracking-[0.06em] ${isToday ? 'text-pl-orange' : 'text-pl-muted'}`}>
                {DAY_NAMES[dayIdx]}
              </span>
              <span className={`leading-tight mt-0.5 font-nb-mono ${
                isToday
                  ? 'w-7 h-7 rounded-full bg-pl-orange text-white flex items-center justify-center text-[14px] font-[700]'
                  : 'text-[15px] font-[700] text-pl-muted-light'
              }`}>
                {day.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex" style={{ minHeight: `${CAL_HEIGHT}px` }}>

          {/* Time gutter — drag up/down to zoom */}
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

          {/* Week grid */}
          <div
            className="flex-1 relative"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${visibleDayCount}, 1fr)`, height: `${CAL_HEIGHT}px` }}
          >
            {/* Light zones: before/after working hours, and (optionally) weekends */}
            <div className="absolute inset-0 pointer-events-none z-5">
              {/* Before work start */}
              <div
                className="absolute left-0 right-0 bg-white/60"
                style={{ top: 0, height: `${(workStartMin - DAY_START_MIN) * PX_PER_MIN}px` }}
              />
              {/* After work end */}
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

            {/* Current time indicator */}
            {showNow && todayInWeek && (() => {
              const visibleIndex = visibleDayIndexes.indexOf(todayIndex)
              if (visibleIndex === -1) return null
              const colPct = 100 / visibleDayCount
              return (
                <div
                  className="absolute z-20 pointer-events-none flex items-center"
                  style={{
                    top:   `${nowTop}px`,
                    left:  `calc(${visibleIndex * colPct}%)`,
                    width: `calc(${colPct}%)`,
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-pl-orange flex-shrink-0 -ml-1" />
                  <div className="flex-1 h-[1.5px] bg-pl-orange" />
                </div>
              )
            })()}

            {/* Day columns */}
            {visibleDayIndexes.map((dayIdx, visibleIdx) => {
              const day      = weekDays[dayIdx]
              const iso      = toISO(day)
              const isToday  = iso === todayISO
              const daySegments  = eventsByDate.get(iso) ?? []
              const rawDayTasks = tasksByDate.get(iso) ?? []
              const { colMap, maxCols: evtMaxCols } = assignColumns(daySegments)

              // Apply intercalation overrides for non-dragged tasks
              const overrideMap = new Map<string, TaskPlacement>()
              if (intercalationPreview) {
                for (const p of intercalationPreview.placements) {
                  overrideMap.set(p.taskId, p)
                }
              }
              const dayTasks = rawDayTasks.map(({ block: tb, dayOffset }) => {
                const override = overrideMap.get(tb.task.id)
                if (!override || dayOffset > 0 || (taskDragPreview && taskDragPreview.taskId === tb.task.id)) {
                  return { block: tb, dayOffset }
                }
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
              // Stable lane index (0–2) per template for available steps, so
              // overlapping available regions from different templates occupy
              // distinct thirds of the day column.
              const AVAIL_LANES = 3
              const availLaneMap = new Map<string, number>()
              const primaryDayTasks = dayTasks
                .filter(({ dayOffset }) => dayOffset === 0)
                .slice()
                .sort((a, b) => {
                  const aStart = a.block.scheduledStart.getTime()
                  const bStart = b.block.scheduledStart.getTime()
                  return aStart - bStart || a.block.task.id.localeCompare(b.block.task.id)
                })
              primaryDayTasks.forEach(({ block: tb }, index) => {
                const lane = Math.min(index, AVAIL_LANES - 1)
                availLaneMap.set(tb.task.id, lane)
              })
              const { colMap: taskColMap, maxCols: taskMaxCols } = assignTaskColumns(dayTasks)

              return (
                <div
                  key={dayIdx}
                  className={`relative border-l border-pl-cream-border ${visibleIdx === 0 ? 'first:border-l-0' : ''} select-none ${isToday ? 'bg-pl-orange/[0.02]' : ''}`}
                  style={{ height: `${CAL_HEIGHT}px`, cursor: dragPreview ? 'ns-resize' : 'crosshair' }}
                  onMouseDown={e => handleColMouseDown(e, iso, dayIdx)}
                >
                  {/* Drag preview block — Google Calendar style */}
                  {dragPreview && dragPreview.dayIdx === dayIdx && (() => {
                    const pxH = Math.max((dragPreview.endMin - dragPreview.startMin) * PX_PER_MIN, 18)
                    return (
                      <div
                        className="absolute z-20 pointer-events-none rounded-[4px] overflow-hidden"
                        style={{
                          top:    `${(dragPreview.startMin - DAY_START_MIN) * PX_PER_MIN}px`,
                          height: `${pxH}px`,
                          left:   '2px', right: '2px',
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

                  {daySegments.map(seg => {
                    const startMin = Math.max(seg.startMin, DAY_START_MIN)
                    const endMin   = Math.min(seg.endMin,   DAY_END_MIN)
                    const top      = (startMin - DAY_START_MIN) * PX_PER_MIN
                    const height   = Math.max((endMin - startMin) * PX_PER_MIN, 18)
                    const col      = colMap.get(seg.id) ?? 0

                    return (
                      <EventBlock
                        key={seg.id}
                        event={seg.event}
                        top={top}
                        height={height}
                        col={col}
                        maxCols={evtMaxCols}
                        onClick={e => { e.stopPropagation(); onEventClick(seg.event) }}
                        onMouseDown={e => e.stopPropagation()}
                      />
                    )
                  })}
                  {dayTasks.map(({ block: tb, dayOffset }) => {
                    const dragState = taskDragRef.current
                    const isOriginDragged =
                      dragState &&
                      dragState.taskId === tb.task.id &&
                      dragState.originDayISO === iso &&
                      dayOffset === 0 &&
                      dragState.hasStarted

                    // While a task is being dragged (and after drop while we wait for
                    // the DB update to reflect), hide all "real" instances so we don't
                    // snap back to the origin column before the refetch completes.
                    if (taskDragPreview && taskDragPreview.taskId === tb.task.id) {
                      // Keep a faint ghost at the origin only during the active drag.
                      if (isOriginDragged) {
                        const taskKey = `${tb.task.id}-${dayOffset}`
                        const taskCol = taskColMap.get(taskKey) ?? 0
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
                            isDragGhost
                          />
                        )
                      }
                      return null
                    }

                    const taskKey = `${tb.task.id}-${dayOffset}`
                    const taskCol = taskColMap.get(taskKey) ?? 0

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
                        onMouseDown={
                          dayOffset === 0 && !isOriginDragged
                            ? (e) => handleTaskMouseDown(e, tb, iso, dayIdx)
                            : undefined
                        }
                      />
                    )
                  })}

                  {/* Pending (new) task drag-preview — place by dragging onto the calendar */}
                  {pendingDragPreview && pendingTask && pendingDragPreview.dayIdx === dayIdx && (() => {
                    const solverPlacement = intercalationPreview?.placements.find(
                      p => p.taskId === pendingDragPreview.taskId,
                    )
                    const dragTask: PlannerTask = solverPlacement
                      ? { ...pendingTask, steps: solverPlacement.steps }
                      : pendingTask

                    const startMin = pendingDragPreview.startMin
                    const durMin = computeDurationMin(dragTask.steps as StepData[])
                    const startDate = new Date(weekDays[dayIdx])
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
                  {taskDragPreview && taskDragPreview.dayIdx === dayIdx && (() => {
                    const dragged = taskBlockById.get(taskDragPreview.taskId)
                    if (!dragged) return null

                    // Use solver-adjusted steps for the dragged block if available
                    const solverPlacement = intercalationPreview?.placements.find(
                      p => p.taskId === taskDragPreview.taskId,
                    )
                    const dragBlock = solverPlacement
                      ? { ...dragged, task: { ...dragged.task, steps: solverPlacement.steps } }
                      : dragged

                    return (
                      <TaskBlock
                        key={`drag-${dragged.task.id}`}
                        block={dragBlock}
                        col={0}
                        maxCols={1}
                        availLaneIndex={availLaneMap.get(dragged.task.id) ?? 0}
                        dayOffset={0}
                        pxPerHour={pxPerHour}
                        onClick={onTaskClick}
                        dragOverrideStartMin={taskDragPreview.startMin}
                        dragTimeLabels={showDragLabels ? {
                          start: minToLabel(taskDragPreview.startMin),
                          end:   minToLabel(taskDragPreview.endMin),
                        } : undefined}
                      />
                    )
                  })()}
                </div>
              )
            })}
          </div>

        </div>
      </div>

    </div>
  )
}
