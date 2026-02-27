'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import type { CalendarEvent } from '../types'
import TaskBlock from './TaskBlock'
import type { ScheduledTaskBlock } from './TaskBlock'
import { getTimezone } from '@/lib/preferences'

// ── Constants ─────────────────────────────────────────────────────────────────
const PX_PER_HOUR  = 80
const PX_PER_MIN   = PX_PER_HOUR / 60
const DAY_START    = 0   // 00:00
const DAY_END      = 24  // 24:00
const DAY_START_MIN = DAY_START * 60
const DAY_END_MIN   = DAY_END   * 60
const CAL_HEIGHT    = (DAY_END_MIN - DAY_START_MIN) * PX_PER_MIN

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

function minToLabel(min: number): string {
  let h = Math.floor(min / 60)
  const m = min % 60
  // Display 24:00 as 00:00 (midnight)
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

// Greedy column layout for overlapping events
function assignColumns(events: CalendarEvent[]): { colMap: Map<string, number>; maxCols: number } {
  const sorted = [...events].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
  )
  const colEnds: number[] = []
  const colMap  = new Map<string, number>()

  for (const ev of sorted) {
    const startMin = timeToMin(ev.start_at)
    const endMin   = Math.max(timeToMin(ev.end_at), startMin + 30)
    let col = colEnds.findIndex(e => e <= startMin)
    if (col === -1) { col = colEnds.length; colEnds.push(endMin) }
    else colEnds[col] = endMin
    colMap.set(ev.id, col)
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

  const sTime = new Date(event.start_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const eTime = new Date(event.end_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

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
  onEventClick:    (event: CalendarEvent) => void
  onSlotClick:     (date: string, time: string, endTime?: string) => void
  onTaskClick?:    (task: import('../hooks/usePlannerTasks').PlannerTask) => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function WeekCalendar({
  weekStart, events, scheduledTasks = [], onEventClick, onSlotClick, onTaskClick,
}: WeekCalendarProps) {
  const weekDays   = getWeekDays(weekStart)
  const todayISO   = toISO(new Date())
  const scrollRef  = useRef<HTMLDivElement>(null)
  const [tz, setTz] = useState<string>(() => getTimezone())
  const [nowMin, setNowMin] = useState(() => {
    const n = new Date(); return n.getHours() * 60 + n.getMinutes()
  })

  // Drag-to-create state
  const dragRef     = useRef<{ dayISO: string; dayIdx: number; anchorMin: number } | null>(null)
  const onSlotRef   = useRef(onSlotClick)
  useEffect(() => { onSlotRef.current = onSlotClick }, [onSlotClick])
  const [dragPreview, setDragPreview] = useState<{
    dayIdx: number; startMin: number; endMin: number
  } | null>(null)

  // Re-read timezone when user changes it in settings
  useEffect(() => {
    const handler = () => setTz(getTimezone())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
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

  // Group events by local calendar date (timezone-aware)
  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const key = evLocalDate(ev.start_at, tz)
    if (!eventsByDate.has(key)) eventsByDate.set(key, [])
    eventsByDate.get(key)!.push(ev)
  }

  // Group scheduled tasks by ISO date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, ScheduledTaskBlock[]>()
    for (const tb of scheduledTasks) {
      const key = toISO(tb.scheduledStart)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(tb)
    }
    return map
  }, [scheduledTasks])

  const hourMarks: number[] = []
  for (let m = DAY_START_MIN; m <= DAY_END_MIN; m += 60) hourMarks.push(m)

  const nowTop   = (nowMin - DAY_START_MIN) * PX_PER_MIN
  const showNow  = nowMin >= DAY_START_MIN && nowMin <= DAY_END_MIN
  const todayInWeek = weekDays.some(d => toISO(d) === todayISO)

  // Stable helper: reads from refs/constants only, safe to call from any closure
  const clientYToMin = useRef((clientY: number): number => {
    const container = scrollRef.current
    if (!container) return DAY_START_MIN
    const rect = container.getBoundingClientRect()
    const y    = clientY - rect.top + container.scrollTop
    const min  = Math.round(y / PX_PER_MIN / 15) * 15 + DAY_START_MIN
    return Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, min))
  }).current

  function handleColMouseDown(e: React.MouseEvent, dayISO: string, dayIdx: number) {
    if (e.button !== 0) return
    e.preventDefault()
    const anchorMin = clientYToMin(e.clientY)
    dragRef.current = { dayISO, dayIdx, anchorMin }
    // Start with a minimal 15-min block — grows as the user drags
    setDragPreview({ dayIdx, startMin: anchorMin, endMin: anchorMin + 15 })
  }

  // Global mouse listeners for drag
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return
      const { anchorMin, dayIdx } = dragRef.current
      const currentMin = clientYToMin(e.clientY)
      // Anchor is always the TOP — extend downward only (like Google Calendar)
      const endMin = Math.max(currentMin, anchorMin + 15)
      setDragPreview({ dayIdx, startMin: anchorMin, endMin })
    }

    function onMouseUp() {
      const d = dragRef.current
      if (!d) return
      dragRef.current = null
      setDragPreview(prev => {
        if (prev) {
          // ≥ 30 min drag → pass end time; shorter → simple click (default 1h in modal)
          if (prev.endMin - prev.startMin >= 30) {
            onSlotRef.current(d.dayISO, minToLabel(prev.startMin), minToLabel(prev.endMin))
          } else {
            onSlotRef.current(d.dayISO, minToLabel(prev.startMin))
          }
        }
        return null
      })
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden min-w-[560px]">

      {/* Day headers — sticky */}
      <div className="flex pl-[52px] border-b border-pl-cream-border flex-shrink-0 bg-pl-cream">
        {weekDays.map((day, i) => {
          const iso     = toISO(day)
          const isToday = iso === todayISO
          return (
            <div
              key={i}
              className={`flex-1 flex flex-col items-center py-2 border-l border-pl-cream-border first:border-l-0 ${isToday ? 'bg-pl-orange/[0.04]' : ''}`}
            >
              <span className={`text-[10px] font-[600] font-nb-mono uppercase tracking-[0.06em] ${isToday ? 'text-pl-orange' : 'text-pl-muted'}`}>
                {DAY_NAMES[i]}
              </span>
              <span className={`leading-tight mt-0.5 font-nb-mono ${
                isToday
                  ? 'w-7 h-7 rounded-full bg-pl-orange text-white flex items-center justify-center text-[14px] font-[700]'
                  : 'text-[15px] font-[700] text-pl-muted-light'
              }`}>
                {day.getDate()}
              </span>
              <span className="text-[9px] text-pl-muted-light font-nb-mono">{MONTH_ABBR[day.getMonth()]}</span>
            </div>
          )
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex" style={{ minHeight: `${CAL_HEIGHT}px` }}>

          {/* Time gutter */}
          <div className="flex-shrink-0 w-[52px] relative bg-pl-cream" style={{ height: `${CAL_HEIGHT}px` }}>
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

          {/* 7-day grid */}
          <div
            className="flex-1 relative"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', height: `${CAL_HEIGHT}px` }}
          >
            {/* Light zones: before 8h, after 20h, and weekends */}
            <div className="absolute inset-0 pointer-events-none z-5">
              {/* Before 8:00 */}
              <div
                className="absolute left-0 right-0 bg-white/60"
                style={{ top: 0, height: `${(480 - DAY_START_MIN) * PX_PER_MIN}px` }}
              />
              {/* After 20:00 */}
              <div
                className="absolute left-0 right-0 bg-white/60"
                style={{ top: `${(1200 - DAY_START_MIN) * PX_PER_MIN}px`, height: `${(DAY_END_MIN - 1200) * PX_PER_MIN}px` }}
              />
              {/* Weekend columns (Sat=5, Sun=6) */}
              {[5, 6].map(colIdx => (
                <div
                  key={`weekend-${colIdx}`}
                  className="absolute top-0 bottom-0 bg-white/60"
                  style={{
                    left: `calc(${(colIdx / 7) * 100}%)`,
                    width: `calc(${(1 / 7) * 100}%)`,
                  }}
                />
              ))}
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
              const todayColIdx = weekDays.findIndex(d => toISO(d) === todayISO)
              const colPct      = 100 / 7
              return (
                <div
                  className="absolute z-20 pointer-events-none flex items-center"
                  style={{
                    top:   `${nowTop}px`,
                    left:  `calc(${todayColIdx * colPct}%)`,
                    width: `calc(${colPct}%)`,
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-pl-orange flex-shrink-0 -ml-1" />
                  <div className="flex-1 h-[1.5px] bg-pl-orange" />
                </div>
              )
            })()}

            {/* Day columns */}
            {weekDays.map((day, i) => {
              const iso      = toISO(day)
              const isToday  = iso === todayISO
              const dayEvts  = eventsByDate.get(iso) ?? []
              const dayTasks = tasksByDate.get(iso) ?? []
              const { colMap, maxCols: evtMaxCols } = assignColumns(dayEvts)

              // Overlap layout for tasks (simple side-by-side)
              const taskMaxCols = Math.max(dayTasks.length, 1)

              return (
                <div
                  key={i}
                  className={`relative border-l border-pl-cream-border first:border-l-0 z-10 select-none ${isToday ? 'bg-pl-orange/[0.02]' : ''}`}
                  style={{ height: `${CAL_HEIGHT}px`, cursor: dragPreview ? 'ns-resize' : 'crosshair' }}
                  onMouseDown={e => handleColMouseDown(e, iso, i)}
                >
                  {/* Drag preview block — Google Calendar style */}
                  {dragPreview && dragPreview.dayIdx === i && (() => {
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

                  {dayEvts.map(ev => {
                    const startMin = Math.max(timeToMin(ev.start_at, tz), DAY_START_MIN)
                    const endMin   = Math.min(timeToMin(ev.end_at, tz),   DAY_END_MIN)
                    const top      = (startMin - DAY_START_MIN) * PX_PER_MIN
                    const height   = Math.max((endMin - startMin) * PX_PER_MIN, 18)
                    const col      = colMap.get(ev.id) ?? 0

                    return (
                      <EventBlock
                        key={ev.id}
                        event={ev}
                        top={top}
                        height={height}
                        col={col}
                        maxCols={evtMaxCols}
                        onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                        onMouseDown={e => e.stopPropagation()}
                      />
                    )
                  })}
                  {dayTasks.map((tb, ti) => (
                    <div key={tb.task.id} onMouseDown={e => e.stopPropagation()}>
                      <TaskBlock
                        block={tb}
                        col={ti}
                        maxCols={taskMaxCols}
                        onClick={onTaskClick}
                      />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

        </div>
      </div>

    </div>
  )
}
