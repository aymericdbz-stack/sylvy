'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import type { CalendarEvent } from '../types'
import TaskBlock from './TaskBlock'
import type { ScheduledTaskBlock } from './TaskBlock'
import { getTimezone } from '@/lib/preferences'

// ── Constants ─────────────────────────────────────────────────────────────────
const PX_PER_HOUR_DEFAULT = 52
const DAY_START = 0
const DAY_END = 24
const DAY_START_MIN = DAY_START * 60
const DAY_END_MIN = DAY_END * 60

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
  onEventClick: (event: CalendarEvent) => void
  onSlotClick: (date: string, time: string, endTime?: string) => void
  onTaskClick?: (task: import('../hooks/usePlannerTasks').PlannerTask, stepId?: string) => void
  workStartHour: number
  workEndHour: number
  onTaskMove?: (taskId: string, date: string, time: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DayCalendar({
  date,
  events,
  scheduledTasks = [],
  onEventClick,
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
      const viewH = el.clientHeight || 0
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
      const container = el
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
      const centerY = e.clientY ?? (el.getBoundingClientRect().top + el.clientHeight / 2)
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

  const eventsForDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const key = evLocalDate(ev.start_at, tz)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    }
    return map.get(dayISO) ?? []
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
    const min = Math.round(y / PX_PER_MIN / 15) * 15 + DAY_START_MIN
    return Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, min))
  }

  // Drag-to-move for task templates
  const taskDragRef = useRef<{
    taskId:          string
    pointerOffsetMin: number
    durationMin:     number
    originalStartMin: number
  } | null>(null)
  const [taskDragPreview, setTaskDragPreview] = useState<{
    taskId:   string
    startMin: number
    endMin:   number
  } | null>(null)
  const taskDragPreviewRef = useRef<typeof taskDragPreview | null>(null)
  useEffect(() => {
    taskDragPreviewRef.current = taskDragPreview
  }, [taskDragPreview])
  const onTaskMoveRef = useRef(onTaskMove)
  useEffect(() => {
    onTaskMoveRef.current = onTaskMove
  }, [onTaskMove])

  function handleColMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    const anchorMin = clientYToMinRef.current(e.clientY)
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
    const clampedStart = Math.max(
      DAY_START_MIN,
      Math.min(DAY_END_MIN - durationMin, startMin),
    )
    taskDragRef.current = {
      taskId: tb.task.id,
      pointerOffsetMin,
      durationMin,
      originalStartMin: startMin,
    }
    const initialPreview = {
      taskId: tb.task.id,
      startMin: clampedStart,
      endMin: clampedStart + durationMin,
    }
    setTaskDragPreview(initialPreview)
    taskDragPreviewRef.current = initialPreview
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

      if (taskDragRef.current) {
        const t = taskDragRef.current
        const pointerMin = clientYToMinRef.current(e.clientY)
        let startMin = pointerMin - t.pointerOffsetMin
        startMin = Math.round(startMin / 15) * 15
        startMin = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - t.durationMin, startMin))
        const preview = {
          taskId: t.taskId,
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
          if (prev.endMin - prev.startMin >= 30) {
            onSlotRef.current(d.dayISO, minToHHMM(prev.startMin), minToHHMM(prev.endMin))
          } else {
            onSlotRef.current(d.dayISO, minToHHMM(prev.startMin))
          }
        }
      }

      const t = taskDragRef.current
      const taskMoveCb = onTaskMoveRef.current
      if (t) {
        taskDragRef.current = null
        const prevTask = taskDragPreviewRef.current
        taskDragPreviewRef.current = null
        setTaskDragPreview(null)
        if (prevTask && taskMoveCb && Math.abs(prevTask.startMin - t.originalStartMin) >= 15) {
          taskMoveCb(t.taskId, dayISO, minToHHMM(prevTask.startMin))
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
          <span className="text-[9px] text-pl-muted-light font-nb-mono">
            {MONTH_ABBR[date.getMonth()]}
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
            className="flex-1 relative border-l border-pl-cream-border select-none"
            style={{ height: `${CAL_HEIGHT}px`, cursor: dragPreview ? 'ns-resize' : 'crosshair' }}
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

            {/* Task drag preview */}
            {taskDragPreview && (() => {
              const pxH = Math.max((taskDragPreview.endMin - taskDragPreview.startMin) * PX_PER_MIN, 18)
              return (
                <div
                  className="absolute z-20 pointer-events-none rounded-[4px] overflow-hidden"
                  style={{
                    top: `${(taskDragPreview.startMin - DAY_START_MIN) * PX_PER_MIN}px`,
                    height: `${pxH}px`,
                    left: '2px',
                    right: '2px',
                    backgroundColor: '#F9731633',
                    border: '1.5px solid #F97316',
                  }}
                >
                  <div className="flex flex-col h-full px-1.5 py-0.5 justify-between">
                    <span className="text-[9px] font-[700] text-pl-orange font-nb-mono leading-none">
                      {minToLabel(taskDragPreview.startMin)}
                    </span>
                    {pxH >= 36 && (
                      <span className="text-[9px] font-[600] text-pl-orange/70 font-nb-mono leading-none">
                        {minToLabel(taskDragPreview.endMin)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Events */}
            {eventsForDay.map(ev => {
              const startMin = Math.max(timeToMin(ev.start_at, tz), DAY_START_MIN)
              const endMin = Math.min(timeToMin(ev.end_at, tz), DAY_END_MIN)
              const top = (startMin - DAY_START_MIN) * PX_PER_MIN
              const height = Math.max((endMin - startMin) * PX_PER_MIN, 18)
              return (
                <EventBlock
                  key={ev.id}
                  event={ev}
                  top={top}
                  height={height}
                  onClick={e => {
                    e.stopPropagation()
                    onEventClick(ev)
                  }}
                  onMouseDown={e => e.stopPropagation()}
                />
              )
            })}

            {/* Tasks */}
            {tasksForDay.map(({ block: tb, dayOffset }, ti) => (
              <TaskBlock
                key={`${tb.task.id}-${dayOffset}`}
                block={tb}
                col={ti}
                maxCols={Math.max(tasksForDay.length, 1)}
                dayOffset={dayOffset}
                pxPerHour={pxPerHour}
                onClick={onTaskClick}
                onMouseDown={dayOffset === 0 ? (e) => handleTaskMouseDown(e, tb) : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

