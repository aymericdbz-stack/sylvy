'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { StepData, PlannerTask } from '../hooks/usePlannerTasks'

// ── Constants (must match WeekCalendar) ──────────────────────────────────────
const PX_PER_HOUR  = 80
const PX_PER_MIN   = PX_PER_HOUR / 60
const DAY_START    = 7
const DAY_START_MIN = DAY_START * 60

// ── Types ────────────────────────────────────────────────────────────────────
export interface ScheduledTaskBlock {
  task: PlannerTask
  scheduledStart: Date
  conflict: boolean
  conflictReason?: string
}

interface TaskBlockProps {
  block: ScheduledTaskBlock
  col: number
  maxCols: number
  onClick?: (task: PlannerTask) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function minToLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

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

  // Task boundaries (absolute minutes from midnight)
  const taskStartMin = scheduledStart.getHours() * 60 + scheduledStart.getMinutes()
  const lastStep = steps.reduce((acc, s) => Math.max(acc, s.startOffset + s.duration), 0)
  const taskEndMin = taskStartMin + lastStep

  // Pixel positions relative to grid
  const top    = (taskStartMin - DAY_START_MIN) * PX_PER_MIN
  const height = Math.max((taskEndMin - taskStartMin) * PX_PER_MIN, 24)

  // Column layout
  const colW = 100 / maxCols

  // Sort steps by startOffset for rendering
  const sortedSteps = [...steps].sort((a, b) => a.startOffset - b.startOffset)

  // Build sub-blocks: step + waiting gaps
  const subBlocks: { type: 'step' | 'wait'; label: string; top: number; height: number; step?: StepData }[] = []
  for (let i = 0; i < sortedSteps.length; i++) {
    const s = sortedSteps[i]
    const sTop = s.startOffset * PX_PER_MIN
    const sHeight = s.duration * PX_PER_MIN

    // Wait gap before this step (if there's a gap from previous step end)
    if (i > 0) {
      const prev = sortedSteps[i - 1]
      const prevEnd = prev.startOffset + prev.duration
      if (s.startOffset > prevEnd) {
        const gapMin = s.startOffset - prevEnd
        subBlocks.push({
          type: 'wait',
          label: `\u23F3 ${gapMin}min`,
          top: prevEnd * PX_PER_MIN,
          height: gapMin * PX_PER_MIN,
        })
      }
    }

    subBlocks.push({
      type: 'step',
      label: sHeight >= 20 ? `${s.name} (${s.duration}min)` : s.name,
      top: sTop,
      height: sHeight,
      step: s,
    })
  }

  // Tooltip data
  const totalDuration = steps.reduce((s, st) => s + st.duration, 0)
  const deadlineLabel = task.deadline
    ? new Date(task.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null

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
          border: `1px solid ${conflict ? '#EF444433' : hexToRgba(color, 0.2)}`,
          borderLeft: `2.5px solid ${conflict ? '#EF4444' : color}`,
        }}
      >
        {/* Task name label */}
        <div
          className="sticky top-0 z-10 flex items-center gap-1 px-1.5 py-0.5"
          style={{ backgroundColor: conflict ? '#FEF2F2' : hexToRgba(color, 0.15) }}
        >
          {conflict && <AlertTriangle size={10} className="text-pl-error flex-shrink-0" />}
          <span
            className="text-[9px] font-[700] truncate font-nb-mono leading-tight"
            style={{ color: conflict ? '#7F1D1D' : color }}
          >
            {task.name}
          </span>
        </div>

        {/* Sub-blocks (steps + waits) */}
        {subBlocks.map((sb, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 flex items-center px-1.5 overflow-hidden"
            style={{
              top: `${sb.top + 18}px`, // +18 for the label bar
              height: `${Math.max(sb.height, 12)}px`,
              backgroundColor: sb.type === 'wait'
                ? 'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 6px)'
                : hexToRgba(color, 0.06),
              borderTop: i > 0 ? `1px dashed ${hexToRgba(color, 0.2)}` : undefined,
            }}
          >
            <span
              className="text-[8px] font-nb-mono truncate leading-none"
              style={{ color: sb.type === 'wait' ? '#78716C' : hexToRgba(color, 1) }}
            >
              {sb.label}
            </span>
          </div>
        ))}
      </div>

      {/* Tooltip on hover */}
      {hovered && (
        <div
          className="absolute z-50 bg-pl-charcoal text-white rounded-[6px] px-3 py-2.5 shadow-xl font-nb-mono pointer-events-none"
          style={{
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '6px',
            width: '220px',
            fontSize: '10px',
          }}
        >
          <p className="font-[700] text-[11px] mb-1">{task.name}</p>
          {deadlineLabel && <p className="text-[9px] text-pl-muted-light mb-1.5">Deadline : {deadlineLabel}</p>}
          <p className="text-[9px] text-pl-muted-light mb-1.5">Durée active : {totalDuration} min</p>
          {conflict && conflictReason && (
            <p className="text-[9px] text-red-300 mb-1.5">{conflictReason}</p>
          )}
          <div className="space-y-0.5">
            {sortedSteps.map(s => (
              <p key={s.id} className="text-[9px]">
                <span className="text-pl-muted-light">T+{s.startOffset}</span> {s.name} ({s.duration}min)
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
