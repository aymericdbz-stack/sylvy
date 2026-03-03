'use client'

import type { CalendarEvent } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────
const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTH_NAMES  = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Returns all days to display in the 6-week month grid (Mon–Sun, always 42 cells)
function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const dow      = firstDay.getDay()          // 0 = Sun
  const offset   = dow === 0 ? 6 : dow - 1   // days before first Mon
  const start    = new Date(firstDay)
  start.setDate(start.getDate() - offset)

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface YearCalendarProps {
  yearDate: Date
  events:   CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDayClick:   (date: string) => void   // switch to day view on this date
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function YearCalendar({
  yearDate, events, onEventClick, onDayClick,
}: YearCalendarProps) {
  const year      = yearDate.getFullYear()
  const todayISO  = toISO(new Date())

  // Group events by date
  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const key = ev.start_at.slice(0, 10)
    if (!eventsByDate.has(key)) eventsByDate.set(key, [])
    eventsByDate.get(key)!.push(ev)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-3 gap-8">
          {MONTH_NAMES.map((monthName, monthIdx) => {
            const grid = getMonthGrid(year, monthIdx)

            return (
              <div key={monthName} className="flex flex-col gap-2">
                {/* Month title */}
                <div className="text-[11px] font-[600] font-nb-mono text-pl-orange tracking-[0.08em] uppercase">
                  {monthName}
                </div>

                {/* Mini month grid */}
                <div className="border border-pl-cream-border rounded-[8px] bg-white/70 overflow-hidden">
                  {/* Weekday initials */}
                  <div className="grid grid-cols-7 border-b border-pl-cream-border/80 bg-pl-cream">
                    {DAY_INITIALS.map((d, idx) => (
                      <div
                        key={`${d}-${idx}`}
                        className="py-1 text-center text-[9px] font-[600] font-nb-mono text-pl-muted tracking-[0.08em]"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days */}
                  <div
                    className="grid grid-cols-7"
                    style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}
                  >
                    {grid.map((day, idx) => {
                      const iso      = toISO(day)
                      const isToday  = iso === todayISO
                      const isCurMon = day.getMonth() === monthIdx
                      const dayEvents = eventsByDate.get(iso) ?? []

                      const hasEvents = dayEvents.length > 0

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onDayClick(iso)}
                          className={`
                            relative flex items-center justify-center
                            border-l border-t border-pl-cream-border/60 first:border-l-0
                            text-[10px] font-nb-mono transition-colors
                            ${isCurMon ? 'bg-white/80 hover:bg-pl-orange/[0.06]' : 'bg-pl-cream/60 text-pl-muted-light'}
                          `}
                          style={{ minHeight: 18 }}
                        >
                          <span
                            className={`
                              leading-none
                              ${isToday
                                ? 'w-4 h-4 rounded-full bg-pl-orange text-white flex items-center justify-center text-[9px] font-[700]'
                                : 'text-[10px] font-[500] ' + (isCurMon ? 'text-pl-charcoal' : 'text-pl-muted-light')
                              }
                            `}
                          >
                            {day.getDate()}
                          </span>

                          {/* Dot for days with events */}
                          {hasEvents && !isToday && (
                            <span className="absolute bottom-1 w-0.5 h-0.5 rounded-full bg-pl-orange" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

