'use client'

import { useState } from 'react'
import { AlertTriangle, Hand, Sparkles } from 'lucide-react'
import type { StepData, PlannerTask } from '../hooks/usePlannerTasks'

// ── Constants (must match WeekCalendar) ──────────────────────────────────────
const PX_PER_HOUR   = 80
const PX_PER_MIN    = PX_PER_HOUR / 60
const DAY_START     = 0
const DAY_START_MIN = DAY_START * 60

// ── Types ────────────────────────────────────────────────────────────────────
export interface ScheduledTaskBlock {
  task:            PlannerTask
  scheduledStart:  Date
  conflict:        boolean
  conflictReason?: string
}

interface TaskBlockProps {
  block:    ScheduledTaskBlock
  col:      number
  maxCols:  number
  onClick?: (task: PlannerTask) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

// ── Component ────────────────────────────────────────────────────────────────
export default function TaskBlock({ block, col, maxCols, onClick }: TaskBlockProps) {
  const [hovered, setHovered] = useState(false)
  const { task, scheduledStart, conflict, conflictReason } = block
  const steps = task.steps as StepData[]
  const color = task.color ?? '#F97316'

  // Task boundaries
  const taskStartMin = scheduledStart.getHours() * 60 + scheduledStart.getMinutes()
  const lastStep     = steps.reduce((acc, s) => Math.max(acc, s.startOffset + s.duration), 0)
  const taskEndMin   = taskStartMin + lastStep

  // Pixel positions relative to grid
  const top    = (taskStartMin - DAY_START_MIN) * PX_PER_MIN
  const height = Math.max((taskEndMin - taskStartMin) * PX_PER_MIN, 24)

  // Column layout
  const colW = 100 / maxCols

  // Sort steps by startOffset
  const sortedSteps = [...steps].sort((a, b) => a.startOffset - b.startOffset)

  // Tooltip data
  const totalDuration = steps.reduce((a, s) => a + s.duration, 0)
  const deadlineLabel = task.deadline
    ? new Date(task.deadline).toLocaleDateString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null
  const isManual    = task.placement === 'manual'
  const isScheduled = !isManual && !!task.scheduled_start

  return (
    <div
      className="absolute z-10 overflow-visible"
      style={{
        top:    `${top}px`,
        height: `${height}px`,
        left:   `calc(${col * colW}% + 1px)`,
        width:  `calc(${colW}% - 2px)`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Main block container */}
      <div
        className="relative w-full h-full rounded-[4px] overflow-hidden cursor-pointer"
        onClick={e => { e.stopPropagation(); onClick?.(task) }}
        style={{
          backgroundColor: conflict ? '#FEF2F2' : hexToRgba(color, 0.08),
          border:          `1px solid ${conflict ? '#EF444433' : hexToRgba(color, 0.2)}`,
          borderLeft:      `2.5px solid ${conflict ? '#EF4444' : color}`,
        }}
      >
        {/* Task name label */}
        <div
          className="sticky top-0 z-10 flex items-center gap-1 px-1.5 py-0.5"
          style={{ backgroundColor: conflict ? '#FEF2F2' : hexToRgba(color, 0.15) }}
        >
          {conflict    && <AlertTriangle size={10} className="text-pl-error flex-shrink-0" />}
          {isManual    && !conflict && <Hand      size={9}  className="flex-shrink-0 opacity-60" style={{ color }} />}
          {isScheduled && !conflict && <Sparkles  size={9}  className="flex-shrink-0 opacity-60" style={{ color }} />}
          <span
            className="text-[9px] font-[700] truncate font-nb-mono leading-tight"
            style={{ color: conflict ? '#7F1D1D' : color }}
          >
            {task.name}
          </span>
        </div>

        {/* Step sub-blocks */}
        {sortedSteps.map((s, i) => {
          const sTop    = s.startOffset * PX_PER_MIN
          const sHeight = s.duration    * PX_PER_MIN
          const label   = sHeight >= 20 ? `${s.name} (${s.duration}min)` : s.name

          return (
            <div
              key={s.id}
              className="absolute left-0 right-0 flex items-center px-1.5 overflow-hidden"
              style={{
                top:             `${sTop + 18}px`,
                height:          `${Math.max(sHeight, 12)}px`,
                backgroundColor: hexToRgba(color, 0.06),
                borderTop:       i > 0 ? `1px dashed ${hexToRgba(color, 0.2)}` : undefined,
              }}
            >
              <span
                className="text-[8px] font-nb-mono truncate leading-none"
                style={{ color: hexToRgba(color, 1) }}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Tooltip on hover */}
      {hovered && (
        <div
          className="absolute z-50 bg-pl-charcoal text-white rounded-[6px] px-3 py-2.5 shadow-xl font-nb-mono pointer-events-none"
          style={{
            top:       '100%',
            left:      '50%',
            transform: 'translateX(-50%)',
            marginTop: '6px',
            width:     '230px',
            fontSize:  '10px',
          }}
        >
          {/* Name */}
          <p className="font-[700] text-[11px] truncate mb-1">{task.name}</p>

          {/* Placement */}
          <p className="text-[9px] text-pl-muted-light mb-1">
            {isManual ? '✋ Manual' : '✦ Auto'}
          </p>

          {deadlineLabel && (
            <p className="text-[9px] text-pl-muted-light mb-1.5">Deadline: {deadlineLabel}</p>
          )}
          <p className="text-[9px] text-pl-muted-light mb-1.5">Duration: {totalDuration} min</p>

          {conflict && conflictReason && (
            <p className="text-[9px] text-red-300 mb-1.5">{conflictReason}</p>
          )}

          {/* Steps */}
          <div className="space-y-0.5 border-t border-white/10 pt-1.5 mt-1">
            {sortedSteps.map(s => (
              <p key={s.id} className="text-[9px] flex items-center gap-1">
                <span className="text-pl-muted-light">T+{s.startOffset}</span>
                <span>{s.name}</span>
                <span className="text-pl-muted-light ml-auto">({s.duration}min)</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
