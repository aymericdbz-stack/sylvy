'use client'

import { Beaker, Leaf, Wrench, FileText, Zap } from 'lucide-react'
import type { Schedule, ScheduledTask } from './types'

// ── Constants ─────────────────────────────────────────────────────────────────
const PX_PER_HOUR = 72
const PX_PER_MIN  = PX_PER_HOUR / 60
const DAY_NAMES   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_ABBR  = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Returns [Mon, Tue, ..., Sun] for the week containing dateStr
function getWeekDays(dateStr: string): Date[] {
  const d = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = d.getDay() // 0 = Sun
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    return day
  })
}

// Greedy column assignment for overlapping tasks within a day
function assignColumns(tasks: ScheduledTask[]): { colMap: Map<string, number>; maxCols: number } {
  const sorted = [...tasks].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
  const colEnds: number[] = []
  const colMap = new Map<string, number>()
  for (const task of sorted) {
    const start = timeToMinutes(task.start_time)
    const end   = timeToMinutes(task.end_time)
    let col = colEnds.findIndex(e => e <= start)
    if (col === -1) { col = colEnds.length; colEnds.push(end) }
    else colEnds[col] = end
    colMap.set(task.id, col)
  }
  return { colMap, maxCols: Math.max(colEnds.length, 1) }
}

// ── Category styles ───────────────────────────────────────────────────────────
const categoryStyle: Record<ScheduledTask['category'], {
  bg: string; border: string; icon: React.ElementType; iconColor: string
}> = {
  assay:   { bg: 'bg-orange-50', border: 'border-l-pl-orange',  icon: Beaker,   iconColor: 'text-pl-orange'  },
  culture: { bg: 'bg-green-50',  border: 'border-l-green-500',  icon: Leaf,     iconColor: 'text-green-600'  },
  prep:    { bg: 'bg-blue-50',   border: 'border-l-blue-400',   icon: Wrench,   iconColor: 'text-blue-500'   },
  admin:   { bg: 'bg-stone-50',  border: 'border-l-stone-400',  icon: FileText, iconColor: 'text-stone-400'  },
  other:   { bg: 'bg-amber-50',  border: 'border-l-amber-400',  icon: Zap,      iconColor: 'text-amber-500'  },
}

// ── Day Column ────────────────────────────────────────────────────────────────
function DayColumn({
  tasks, dayStartMin,
}: {
  tasks: ScheduledTask[]
  dayStartMin: number
}) {
  const { colMap, maxCols } = assignColumns(tasks)

  return (
    <>
      {tasks.map(task => {
        const style  = categoryStyle[task.category]
        const Icon   = style.icon
        const top    = (timeToMinutes(task.start_time) - dayStartMin) * PX_PER_MIN
        const height = Math.max(task.duration_min * PX_PER_MIN, 24)
        const isTiny = height < 36
        const col    = colMap.get(task.id) ?? 0
        const colW   = 100 / maxCols

        return (
          <div
            key={task.id}
            className={`absolute rounded-[4px] border border-pl-cream-border border-l-[2px] ${style.bg} ${style.border} overflow-hidden`}
            style={{
              top:    `${top}px`,
              height: `${height}px`,
              left:   `calc(${col * colW}% + 1px)`,
              width:  `calc(${colW}% - 2px)`,
            }}
          >
            <div className={`flex h-full ${isTiny ? 'flex-row items-center gap-1 px-1.5' : 'flex-col px-1.5 py-1 gap-0.5'}`}>
              <Icon size={isTiny ? 8 : 9} className={`flex-shrink-0 ${style.iconColor}`} />
              <span className={`font-[600] text-pl-charcoal font-nb-mono truncate leading-tight ${isTiny ? 'text-[9px]' : 'text-[10px]'}`}>
                {task.title}
              </span>
              {!isTiny && (
                <span className="text-[9px] text-pl-muted font-nb-mono whitespace-nowrap">
                  {task.start_time}–{task.end_time}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}

// ── Week View ─────────────────────────────────────────────────────────────────
interface WeekViewProps {
  schedule: Schedule
}

export default function WeekView({ schedule }: WeekViewProps) {
  const weekDays    = getWeekDays(schedule.date)
  const todayISO    = toISODate(new Date())

  // Time bounds — auto from tasks, minimum 08:00–18:00
  const starts = schedule.tasks.map(t => timeToMinutes(t.start_time))
  const ends   = schedule.tasks.map(t => timeToMinutes(t.end_time))
  const dayStartMin = Math.min(starts.length ? Math.floor(Math.min(...starts) / 60) * 60 : 8 * 60, 8 * 60)
  const dayEndMin   = Math.max(ends.length   ? Math.ceil(Math.max(...ends)   / 60) * 60 : 18 * 60, 18 * 60)
  const calHeight   = (dayEndMin - dayStartMin) * PX_PER_MIN

  const hourMarks: number[] = []
  for (let m = dayStartMin; m <= dayEndMin; m += 60) hourMarks.push(m)

  // Group tasks by date (fallback to schedule.date if no date on task)
  const tasksByDate = new Map<string, ScheduledTask[]>()
  for (const task of schedule.tasks) {
    const key = task.date ?? schedule.date
    if (!tasksByDate.has(key)) tasksByDate.set(key, [])
    tasksByDate.get(key)!.push(task)
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">

        {/* Day headers */}
        <div className="flex pl-[52px] border-b border-pl-cream-border">
          {weekDays.map((day, i) => {
            const iso          = toISODate(day)
            const isToday      = iso === todayISO
            const isActiveDay  = iso === schedule.date
            return (
              <div
                key={i}
                className={`flex-1 flex flex-col items-center py-2 border-l border-pl-cream-border first:border-l-0 ${isToday ? 'bg-pl-orange/[0.04]' : ''}`}
              >
                <span className={`text-[10px] font-[600] font-nb-mono uppercase tracking-[0.06em] ${isToday ? 'text-pl-orange' : 'text-pl-muted'}`}>
                  {DAY_NAMES[i]}
                </span>
                <span className={`text-[15px] font-[700] font-nb-mono leading-tight mt-0.5 ${
                  isToday ? 'text-pl-orange' : isActiveDay ? 'text-pl-charcoal' : 'text-pl-muted-light'
                }`}>
                  {day.getDate()}
                </span>
                <span className="text-[9px] text-pl-muted-light font-nb-mono">
                  {MONTH_ABBR[day.getMonth()]}
                </span>
                {/* Dot indicator on active (schedule) day */}
                {isActiveDay && !isToday && (
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-pl-orange block" />
                )}
              </div>
            )
          })}
        </div>

        {/* Grid */}
        <div className="flex">

          {/* Time gutter */}
          <div className="flex-shrink-0 w-[52px] relative" style={{ height: `${calHeight}px` }}>
            {hourMarks.map(min => (
              <div
                key={min}
                className="absolute right-0 flex justify-end pr-2"
                style={{ top: `${(min - dayStartMin) * PX_PER_MIN - 8}px` }}
              >
                <span className="text-[10px] text-pl-muted-light font-nb-mono leading-none select-none">
                  {minutesToLabel(min)}
                </span>
              </div>
            ))}
          </div>

          {/* 7-day grid */}
          <div
            className="flex-1 relative grid border-l border-pl-cream-border"
            style={{ gridTemplateColumns: 'repeat(7, 1fr)', height: `${calHeight}px` }}
          >
            {/* Hour lines overlay */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {hourMarks.map(min => (
                <div
                  key={min}
                  className="absolute left-0 right-0 border-t border-pl-cream-border"
                  style={{ top: `${(min - dayStartMin) * PX_PER_MIN}px` }}
                />
              ))}
              {hourMarks.slice(0, -1).map(min => (
                <div
                  key={`${min}-half`}
                  className="absolute left-0 right-0 border-t border-dashed border-pl-cream-border/40"
                  style={{ top: `${(min - dayStartMin + 30) * PX_PER_MIN}px` }}
                />
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, i) => {
              const iso      = toISODate(day)
              const isToday  = iso === todayISO
              const dayTasks = tasksByDate.get(iso) ?? []
              return (
                <div
                  key={i}
                  className={`relative border-l border-pl-cream-border first:border-l-0 z-10 ${isToday ? 'bg-pl-orange/[0.025]' : ''}`}
                  style={{ height: `${calHeight}px` }}
                >
                  <DayColumn tasks={dayTasks} dayStartMin={dayStartMin} />
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
