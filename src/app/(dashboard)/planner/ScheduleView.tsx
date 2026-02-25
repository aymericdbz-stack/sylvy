'use client'

import { useState } from 'react'
import { Clock, AlertTriangle, Layers, Beaker, Leaf, Wrench, FileText, Zap, CalendarDays, LayoutList } from 'lucide-react'
import Card from '@/components/ui/pl/Card'
import Badge from '@/components/ui/pl/Badge'
import WeekView from './WeekView'
import type { Schedule, ScheduledTask } from './types'

// ── Constants ─────────────────────────────────────────────────────────────────
const PX_PER_HOUR = 80
const PX_PER_MIN  = PX_PER_HOUR / 60

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

// Greedy column assignment — overlapping tasks go in separate columns
function assignColumns(tasks: ScheduledTask[]): { colMap: Map<string, number>; totalCols: number } {
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
  return { colMap, totalCols: Math.max(colEnds.length, 1) }
}

// ── Category styles ───────────────────────────────────────────────────────────
const categoryStyle: Record<ScheduledTask['category'], {
  bg: string; border: string; icon: React.ElementType; iconColor: string; labelColor: string
}> = {
  assay:   { bg: 'bg-orange-50', border: 'border-l-pl-orange',  icon: Beaker,   iconColor: 'text-pl-orange',  labelColor: 'text-orange-700' },
  culture: { bg: 'bg-green-50',  border: 'border-l-green-500',  icon: Leaf,     iconColor: 'text-green-600',  labelColor: 'text-green-700'  },
  prep:    { bg: 'bg-blue-50',   border: 'border-l-blue-400',   icon: Wrench,   iconColor: 'text-blue-500',   labelColor: 'text-blue-700'   },
  admin:   { bg: 'bg-stone-50',  border: 'border-l-stone-400',  icon: FileText, iconColor: 'text-stone-400',  labelColor: 'text-stone-600'  },
  other:   { bg: 'bg-amber-50',  border: 'border-l-amber-400',  icon: Zap,      iconColor: 'text-amber-500',  labelColor: 'text-amber-700'  },
}

const priorityBadgeColor: Record<ScheduledTask['priority'], 'orange' | 'amber' | 'gray'> = {
  high:   'orange',
  medium: 'amber',
  low:    'gray',
}

// ── Day Task Block ────────────────────────────────────────────────────────────
function TaskBlock({
  task, dayStartMin, colIndex, totalCols,
}: {
  task: ScheduledTask
  dayStartMin: number
  colIndex: number
  totalCols: number
}) {
  const style   = categoryStyle[task.category]
  const Icon    = style.icon
  const top     = (timeToMinutes(task.start_time) - dayStartMin) * PX_PER_MIN
  const height  = Math.max(task.duration_min * PX_PER_MIN, 26)
  const isTiny  = height < 38
  const isSmall = height < 56
  const colW    = 100 / totalCols
  const left    = colIndex * colW

  return (
    <div
      className={`absolute rounded-[5px] border border-pl-cream-border border-l-[3px] ${style.bg} ${style.border} overflow-hidden cursor-default select-none`}
      style={{
        top:    `${top}px`,
        height: `${height}px`,
        left:   `calc(${left}% + 2px)`,
        width:  `calc(${colW}% - 4px)`,
      }}
    >
      <div className={`flex h-full ${isTiny ? 'flex-row items-center gap-1.5 px-2' : 'flex-col px-2 py-1.5 gap-0.5'}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={isTiny ? 9 : 10} className={`flex-shrink-0 ${style.iconColor}`} />
          <span className={`font-[600] text-pl-charcoal font-nb-mono truncate leading-tight ${isTiny ? 'text-[10px]' : 'text-[11px]'}`}>
            {task.title}
          </span>
          {!isTiny && (
            <Badge color={priorityBadgeColor[task.priority]} className="flex-shrink-0 ml-0.5">
              {task.priority}
            </Badge>
          )}
        </div>
        {!isTiny && (
          <div className="flex items-center gap-1 text-[10px] text-pl-muted font-nb-mono">
            <Clock size={9} className="flex-shrink-0" />
            <span>{task.start_time}–{task.end_time}</span>
            <span className="text-pl-muted-light">({task.duration_min}m)</span>
          </div>
        )}
        {!isSmall && task.notes && (
          <p className="text-[10px] text-pl-muted font-nb-mono leading-relaxed line-clamp-2 mt-0.5">
            {task.notes}
          </p>
        )}
        {!isSmall && task.protocol_name && (
          <span className={`text-[9px] font-[600] font-nb-mono uppercase tracking-[0.05em] mt-auto ${style.labelColor}`}>
            {task.protocol_name}
          </span>
        )}
        {isTiny && task.parallel_with && task.parallel_with.length > 0 && (
          <Layers size={9} className="flex-shrink-0 text-pl-muted-light ml-auto" />
        )}
      </div>
    </div>
  )
}

// ── Day Calendar ──────────────────────────────────────────────────────────────
function DayCalendar({ schedule }: { schedule: Schedule }) {
  const { colMap, totalCols } = assignColumns(schedule.tasks)

  const starts     = schedule.tasks.map(t => timeToMinutes(t.start_time))
  const ends       = schedule.tasks.map(t => timeToMinutes(t.end_time))
  const dayStartMin = Math.floor(Math.min(...starts) / 60) * 60
  const dayEndMin   = Math.ceil(Math.max(...ends)   / 60) * 60
  const calHeight   = (dayEndMin - dayStartMin) * PX_PER_MIN

  const hourMarks: number[] = []
  for (let m = dayStartMin; m <= dayEndMin; m += 60) hourMarks.push(m)

  return (
    <div className="flex gap-0 min-w-[320px]">
      {/* Time gutter */}
      <div className="flex-shrink-0 w-[52px] relative" style={{ height: `${calHeight}px` }}>
        {hourMarks.map(min => (
          <div
            key={min}
            className="absolute right-0 flex justify-end pr-2"
            style={{ top: `${(min - dayStartMin) * PX_PER_MIN - 8}px` }}
          >
            <span className="text-[10px] text-pl-muted-light font-nb-mono leading-none">
              {minutesToLabel(min)}
            </span>
          </div>
        ))}
      </div>

      {/* Grid + tasks */}
      <div className="flex-1 relative border-l border-pl-cream-border" style={{ height: `${calHeight}px` }}>
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
        {schedule.tasks.map(task => (
          <TaskBlock
            key={task.id}
            task={task}
            dayStartMin={dayStartMin}
            colIndex={colMap.get(task.id) ?? 0}
            totalCols={totalCols}
          />
        ))}
      </div>
    </div>
  )
}

// ── Schedule View (controller) ────────────────────────────────────────────────
interface ScheduleViewProps {
  schedule: Schedule
}

export default function ScheduleView({ schedule }: ScheduleViewProps) {
  const [view, setView] = useState<'week' | 'day'>('week')

  const totalH = Math.floor(schedule.total_duration_min / 60)
  const totalM = schedule.total_duration_min % 60

  return (
    <div className="space-y-4">

      {/* Summary header */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[11px] font-[600] text-pl-muted uppercase tracking-[0.06em] mb-1">
              Schedule — {schedule.date}
            </p>
            <p className="text-[13px] text-pl-charcoal font-nb-mono leading-relaxed">
              {schedule.summary}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category icons summary */}
            <div className="flex gap-1.5">
              {(['assay', 'culture', 'prep', 'admin', 'other'] as ScheduledTask['category'][]).map(cat => {
                const count = schedule.tasks.filter(t => t.category === cat).length
                if (!count) return null
                const s    = categoryStyle[cat]
                const Icon = s.icon
                return (
                  <div key={cat} className="flex items-center gap-1 text-[10px] font-nb-mono text-pl-muted">
                    <Icon size={10} className={s.iconColor} />
                    <span>{count}</span>
                  </div>
                )
              })}
            </div>
            <div className="h-3 w-px bg-pl-cream-border" />
            <div className="flex items-center gap-1.5 text-[12px] font-[600] text-pl-orange font-nb-mono bg-pl-orange-light px-3 py-1.5 rounded-[6px] border border-pl-orange/20">
              <Clock size={13} />
              {totalH > 0 && `${totalH}h `}{totalM > 0 && `${totalM}min`}
            </div>
          </div>
        </div>
      </Card>

      {/* Warnings + view toggle row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          {schedule.warnings?.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px] text-amber-700 font-nb-mono bg-amber-50 border border-amber-200 rounded-[6px] px-3 py-2">
              <AlertTriangle size={13} className="flex-shrink-0" />
              {w}
            </div>
          ))}
        </div>

        {/* Day / Week toggle */}
        <div className="flex items-center gap-0.5 bg-pl-cream-dark p-0.5 rounded-[6px] border border-pl-cream-border flex-shrink-0">
          <button
            onClick={() => setView('week')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] text-[11px] font-[600] font-nb-mono transition-all ${
              view === 'week'
                ? 'bg-white text-pl-charcoal shadow-sm border border-pl-cream-border'
                : 'text-pl-muted hover:text-pl-charcoal'
            }`}
          >
            <CalendarDays size={12} />
            Week
          </button>
          <button
            onClick={() => setView('day')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] text-[11px] font-[600] font-nb-mono transition-all ${
              view === 'day'
                ? 'bg-white text-pl-charcoal shadow-sm border border-pl-cream-border'
                : 'text-pl-muted hover:text-pl-charcoal'
            }`}
          >
            <LayoutList size={12} />
            Day
          </button>
        </div>
      </div>

      {/* Calendar */}
      <Card className="p-4 overflow-x-auto">
        {view === 'week'
          ? <WeekView schedule={schedule} />
          : <DayCalendar schedule={schedule} />
        }
      </Card>

    </div>
  )
}
