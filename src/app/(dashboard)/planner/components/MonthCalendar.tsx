'use client'

import type { CalendarEvent } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────
const DAY_NAMES  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MAX_EVENTS = 3   // max pills before "+N autres"

const COLOR_MAP: Record<string, string> = {
  orange: '#F97316',
  green:  '#4CAF7D',
  blue:   '#3B82F6',
  purple: '#8B5CF6',
  red:    '#EF4444',
  teal:   '#14B8A6',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Returns all days to display in the 6-week month grid (Mon-Sun, always 42 cells)
function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const dow      = firstDay.getDay()               // 0 = Sun
  const offset   = dow === 0 ? 6 : dow - 1        // days before first Mon
  const start    = new Date(firstDay)
  start.setDate(start.getDate() - offset)

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface MonthCalendarProps {
  month:        Date
  events:       CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDayClick:   (date: string) => void   // switch to week view on this date
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MonthCalendar({
  month, events, onEventClick, onDayClick,
}: MonthCalendarProps) {
  const year     = month.getFullYear()
  const mon      = month.getMonth()
  const grid     = getMonthGrid(year, mon)
  const todayISO = toISO(new Date())

  // Group events by date
  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const key = ev.start_at.slice(0, 10)
    if (!eventsByDate.has(key)) eventsByDate.set(key, [])
    eventsByDate.get(key)!.push(ev)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Day of week headers */}
      <div className="grid grid-cols-7 border-b border-pl-cream-border flex-shrink-0">
        {DAY_NAMES.map(name => (
          <div key={name} className="py-2 text-center text-[10px] font-[600] uppercase tracking-[0.06em] text-pl-muted font-nb-mono border-l border-pl-cream-border first:border-l-0">
            {name}
          </div>
        ))}
      </div>

      {/* Grid (6 rows) */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 h-full" style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}>
          {grid.map((day, idx) => {
            const iso       = toISO(day)
            const isToday   = iso === todayISO
            const isCurMon  = day.getMonth() === mon
            const dayEvents = eventsByDate.get(iso) ?? []
            const visible   = dayEvents.slice(0, MAX_EVENTS)
            const overflow  = dayEvents.length - visible.length

            return (
              <div
                key={idx}
                className={`
                  border-l border-t border-pl-cream-border first:border-l-0
                  p-1 flex flex-col gap-0.5 cursor-pointer
                  hover:bg-pl-orange/[0.02] transition-colors
                  ${(idx % 7 === 0) ? 'border-l-0' : ''}
                `}
                style={{ minHeight: '90px' }}
                onClick={() => onDayClick(iso)}
              >
                {/* Day number */}
                <div className={`text-[11px] font-[600] font-nb-mono leading-none mb-0.5 ${
                  isToday
                    ? 'w-5 h-5 rounded-full bg-pl-orange text-white flex items-center justify-center text-[10px]'
                    : isCurMon ? 'text-pl-charcoal' : 'text-pl-muted-light'
                }`}>
                  {day.getDate()}
                </div>

                {/* Event pills */}
                {visible.map(ev => {
                  const color = COLOR_MAP[ev.color] ?? COLOR_MAP.orange
                  const sTime = ev.all_day ? null : new Date(ev.start_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <button
                      key={ev.id}
                      className="w-full text-left rounded-[3px] px-1 py-0.5 truncate text-[10px] font-[600] font-nb-mono leading-tight hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: `${color}22`, color, borderLeft: `2px solid ${color}` }}
                      onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                    >
                      {sTime && <span className="opacity-70 mr-0.5">{sTime}</span>}
                      {ev.title}
                    </button>
                  )
                })}

                {/* Overflow count */}
                {overflow > 0 && (
                  <span className="text-[10px] text-pl-muted font-nb-mono pl-1">
                    +{overflow} autre{overflow > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
