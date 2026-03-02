'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { StepData, PlannerTask } from '../hooks/usePlannerTasks'

// ── Helpers ───────────────────────────────────────────────────────────────────
function minsToHHMM(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/** Multiply each RGB channel by `factor` to get a darker shade (for readable text on light bg). */
function darkenHex(hex: string, factor = 0.52): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor)
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor)
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor)
  return `rgb(${r},${g},${b})`
}

// ── Constants (must match WeekCalendar) ──────────────────────────────────────
const PX_PER_HOUR = 52
const DAY_MINS    = 1440

// ── Types ────────────────────────────────────────────────────────────────────
export interface ScheduledTaskBlock {
  task:            PlannerTask
  scheduledStart:  Date
  conflict:        boolean
  conflictReason?: string
}

interface TaskBlockProps {
  block:       ScheduledTaskBlock
  col:         number
  maxCols:     number
  /** 0 = day-of, 1440 = next-day overflow (workflow crosses midnight) */
  dayOffset?:  number
  pxPerHour?:  number
  onClick?:    (task: PlannerTask) => void
}

// ── Component ────────────────────────────────────────────────────────────────
// Steps are clipped to the current day's [dayOffset, dayOffset+1440] window so
// that workflows crossing midnight continue into the next day column.
export default function TaskBlock({ block, col, maxCols, onClick, dayOffset = 0, pxPerHour }: TaskBlockProps) {
  const [hovered, setHovered] = useState(false)
  const { task, scheduledStart, conflict, conflictReason } = block
  const steps   = task.steps as StepData[]
  const color   = task.color ?? '#F97316'
  const borderC = conflict ? '#EF4444' : color

  // Zoom-aware pixel/minute ratio — kept in sync with WeekCalendar
  const PX_PER_MIN = (pxPerHour ?? PX_PER_HOUR) / 60

  const taskStartMin = scheduledStart.getHours() * 60 + scheduledStart.getMinutes()

  // Day visibility window in absolute minutes (relative to day J's 00:00)
  const dayVisStart = dayOffset            // 0 or 1440
  const dayVisEnd   = dayOffset + DAY_MINS // 1440 or 2880

  // Connector: spans the visible portion of the full workflow for this day
  const lastStep     = steps.reduce((acc, s) => Math.max(acc, s.startOffset + s.duration), 0)
  const connAbsStart = Math.max(taskStartMin, dayVisStart)
  const connAbsEnd   = Math.min(taskStartMin + lastStep, dayVisEnd)
  const connTop      = (connAbsStart - dayVisStart) * PX_PER_MIN
  const connHeight   = Math.max((connAbsEnd - connAbsStart) * PX_PER_MIN, 0)

  // Column layout
  const colW    = 100 / maxCols
  const colLeft = `calc(${col * colW}% + 1px)`
  const colWidth = `calc(${colW}% - 2px)`

  const sortedSteps = [...steps].sort((a, b) => a.startOffset - b.startOffset)

  // Compute each step's visible slice within this day column
  const visibleSteps = sortedSteps
    .map(s => {
      const absStart = taskStartMin + s.startOffset
      const absEnd   = absStart + s.duration
      const visStart = Math.max(absStart, dayVisStart)
      const visEnd   = Math.min(absEnd, dayVisEnd)
      if (visEnd <= visStart) return null
      return {
        s,
        sTop:    (visStart - dayVisStart) * PX_PER_MIN,
        // No artificial floor — actual pixel height prevents consecutive steps from overlapping.
        // 2px minimum just keeps a tiny sliver visible for very short steps.
        sHeight: Math.max((visEnd - visStart) * PX_PER_MIN, 2),
      }
    })
    .filter(Boolean) as Array<{ s: StepData; sTop: number; sHeight: number }>

  // Nothing to render in this day column
  if (!visibleSteps.length || connHeight === 0) return null

  // Tooltip data
  const totalDuration = steps.reduce((a, s) => a + s.duration, 0)
  const deadlineLabel = task.deadline
    ? new Date(task.deadline).toLocaleDateString('en-US', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : null
  const textColor = conflict ? '#7F1D1D' : darkenHex(color)

  const firstStep = visibleSteps[0]

  return (
    <>
      {/* ── Connector line ─────────────────────────────────────────────────
          Thin vertical line spanning the visible workflow portion. pointer-events-none
          so incubation gaps fall through to the calendar (create event). */}
      <div
        className="absolute pointer-events-none"
        style={{
          top:             `${connTop}px`,
          height:          `${connHeight}px`,
          left:            colLeft,
          width:           '2.5px',
          backgroundColor: borderC,
          zIndex:          10,
        }}
      />

      {/* ── Workflow title — floats above the first step box, day-of only ── */}
      {dayOffset === 0 && <div
        className="absolute flex items-center gap-1 pointer-events-none overflow-hidden"
        style={{
          top:    `${firstStep.sTop - 14}px`,
          left:   colLeft,
          width:  colWidth,
          height: '13px',
          zIndex: 21,
        }}
      >
        {conflict && <AlertTriangle size={9} className="text-pl-error flex-shrink-0" />}
        <span
          className="text-[9px] font-[700] truncate font-nb-mono leading-tight"
          style={{ color: textColor }}
        >
          {task.name}
        </span>
      </div>}

      {/* ── Step blocks ────────────────────────────────────────────────────
          Each step renders only the slice that falls within this day. */}
      {visibleSteps.map(({ s, sTop, sHeight }) => {
        // Scale font size down for small boxes — always visible, never hidden
        const labelSize = sHeight >= 14 ? 8 : sHeight >= 8 ? 7 : 6

        return (
          <div
            key={s.id}
            className="absolute flex flex-col overflow-hidden cursor-pointer"
            style={{
              top:             `${sTop}px`,
              height:          `${sHeight}px`,
              left:            colLeft,
              width:           colWidth,
              backgroundColor: conflict ? '#FEF2F2' : hexToRgba(color, 0.12),
              borderLeft:      `2.5px solid ${borderC}`,
              borderTop:       `1px solid ${conflict ? '#EF444433' : hexToRgba(color, 0.25)}`,
              borderRight:     `1px solid ${conflict ? '#EF444433' : hexToRgba(color, 0.15)}`,
              borderBottom:    `1px solid ${conflict ? '#EF444433' : hexToRgba(color, 0.15)}`,
              borderRadius:    '0 4px 4px 0',
              zIndex:          20,
            }}
            onClick={e => { e.stopPropagation(); onClick?.(task) }}
            onMouseDown={e => e.stopPropagation()}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* Step name — always visible, font shrinks for tiny boxes */}
            <div className="flex items-center px-1 flex-1 min-h-0 overflow-hidden">
              <span
                className="font-nb-mono truncate leading-none"
                style={{ color: textColor, fontSize: `${labelSize}px` }}
              >
                {s.name}
              </span>
            </div>
          </div>
        )
      })}

      {/* ── Tooltip (any step hovered) ─────────────────────────────────── */}
      {hovered && (() => {
        const first = visibleSteps[0]
        return (
          <div
            className="absolute z-50 bg-pl-charcoal text-white rounded-[6px] px-3 py-2.5 shadow-xl font-nb-mono pointer-events-none"
            style={{
              top:      `${first.sTop + first.sHeight + 6}px`,
              left:     colLeft,
              width:    '230px',
              fontSize: '10px',
            }}
          >
            <p className="font-[700] text-[11px] truncate mb-1">{task.name}</p>
            {deadlineLabel && (
              <p className="text-[9px] text-pl-muted-light mb-1.5">Deadline: {deadlineLabel}</p>
            )}
            <p className="text-[9px] text-pl-muted-light mb-1.5">Duration: {totalDuration} min</p>
            {conflict && conflictReason && (
              <p className="text-[9px] text-red-300 mb-1.5">{conflictReason}</p>
            )}
            <div className="space-y-0.5 border-t border-white/10 pt-1.5 mt-1">
              {sortedSteps.map(s => (
                <p key={s.id} className="text-[9px] flex items-center gap-1">
                  <span className="text-pl-muted-light">T+{minsToHHMM(s.startOffset)}</span>
                  <span>{s.name}</span>
                  <span className="text-pl-muted-light ml-auto">({s.duration}min)</span>
                </p>
              ))}
            </div>
          </div>
        )
      })()}
    </>
  )
}
