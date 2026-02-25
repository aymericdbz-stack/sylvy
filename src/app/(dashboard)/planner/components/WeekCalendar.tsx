'use client'

import { useRef, useEffect, useState } from 'react'
import type { CalendarEvent } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────
const PX_PER_HOUR  = 80
const PX_PER_MIN   = PX_PER_HOUR / 60
const DAY_START    = 7   // 07:00
const DAY_END      = 21  // 21:00
const DAY_START_MIN = DAY_START * 60
const DAY_END_MIN   = DAY_END   * 60
const CAL_HEIGHT    = (DAY_END_MIN - DAY_START_MIN) * PX_PER_MIN

const DAY_NAMES  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTH_ABBR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

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
function timeToMin(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function minToLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
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
  event, top, height, col, maxCols, onClick,
}: {
  event: CalendarEvent
  top: number; height: number; col: number; maxCols: number
  onClick: (e: React.MouseEvent) => void
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
  weekStart:      Date
  events:         CalendarEvent[]
  onEventClick:   (event: CalendarEvent) => void
  onSlotClick:    (date: string, time: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function WeekCalendar({
  weekStart, events, onEventClick, onSlotClick,
}: WeekCalendarProps) {
  const weekDays   = getWeekDays(weekStart)
  const todayISO   = toISO(new Date())
  const scrollRef  = useRef<HTMLDivElement>(null)
  const [nowMin, setNowMin] = useState(() => {
    const n = new Date(); return n.getHours() * 60 + n.getMinutes()
  })

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

  // Group events by ISO date
  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const key = ev.start_at.slice(0, 10)
    if (!eventsByDate.has(key)) eventsByDate.set(key, [])
    eventsByDate.get(key)!.push(ev)
  }

  const hourMarks: number[] = []
  for (let m = DAY_START_MIN; m <= DAY_END_MIN; m += 60) hourMarks.push(m)

  const nowTop   = (nowMin - DAY_START_MIN) * PX_PER_MIN
  const showNow  = nowMin >= DAY_START_MIN && nowMin <= DAY_END_MIN
  const todayInWeek = weekDays.some(d => toISO(d) === todayISO)

  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>, dayISO: string) {
    const rect  = e.currentTarget.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const clickedMin = Math.floor(clickY / PX_PER_MIN) + DAY_START_MIN
    const snapped    = Math.round(clickedMin / 15) * 15
    const clamped    = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - 60, snapped))
    onSlotClick(dayISO, minToLabel(clamped))
  }

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
              const { colMap, maxCols } = assignColumns(dayEvts)

              return (
                <div
                  key={i}
                  className={`relative border-l border-pl-cream-border first:border-l-0 z-10 cursor-pointer ${isToday ? 'bg-pl-orange/[0.02]' : ''}`}
                  style={{ height: `${CAL_HEIGHT}px` }}
                  onClick={e => handleColumnClick(e, iso)}
                >
                  {dayEvts.map(ev => {
                    const startMin = Math.max(timeToMin(ev.start_at), DAY_START_MIN)
                    const endMin   = Math.min(timeToMin(ev.end_at),   DAY_END_MIN)
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
                        maxCols={maxCols}
                        onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>

        </div>
      </div>

    </div>
  )
}
