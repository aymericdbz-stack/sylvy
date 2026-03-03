'use client'

import { useState } from 'react'
import { AlertTriangle, Hand, Sparkles } from 'lucide-react'
import type { StepData, PlannerTask } from '../hooks/usePlannerTasks'

// ── Helpers ────────────────────────────────────────────────────────────────────
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

function mixWithWhite(hex: string, mix = 0.9): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const to = (c: number) => Math.round(c * (1 - mix) + 255 * mix)
  return `rgb(${to(r)},${to(g)},${to(b)})`
}

function darkenHex(hex: string, factor = 0.52): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor)
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor)
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor)
  return `rgb(${r},${g},${b})`
}

function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PX_PER_HOUR = 52
const DAY_MINS    = 1440

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ScheduledTaskBlock {
  task:            PlannerTask
  scheduledStart:  Date
  conflict:        boolean
  conflictReason?: string
}

interface TaskBlockProps {
  block:      ScheduledTaskBlock
  col:        number
  maxCols:    number
  dayOffset?: number  // 0 = day-of, 1440 = next-day overflow
  pxPerHour?: number
  onClick?:   (task: PlannerTask, stepId?: string) => void
  onMouseDown?: (e: React.MouseEvent) => void
  /** Optional time labels shown when the template is being dragged. */
  dragTimeLabels?: { start: string; end: string }
  /** When provided, renders the block as if it started at this minute offset within the day. */
  dragOverrideStartMin?: number
  /** When true, render as a semi-transparent drag "ghost". */
  isDragGhost?: boolean
}

// ── Hatched background for available steps ────────────────────────────────────
function hatchedBg(color: string): string {
  // Diagonal stripe pattern using CSS gradient
  const rgba = hexToRgba(color, 0.18)
  const rgba2 = hexToRgba(color, 0.06)
  return `repeating-linear-gradient(
    -45deg,
    ${rgba} 0px,
    ${rgba} 2px,
    ${rgba2} 2px,
    ${rgba2} 8px
  )`
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TaskBlock({
  block, col, maxCols, onClick, onMouseDown, dayOffset = 0, pxPerHour,
  dragTimeLabels,
  dragOverrideStartMin,
  isDragGhost,
}: TaskBlockProps) {
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null)
  const { task, scheduledStart, conflict, conflictReason } = block
  const steps   = task.steps as StepData[]
  const color   = task.color ?? '#F97316'
  const borderC = conflict ? '#EF4444' : color

  const PX_PER_MIN = (pxPerHour ?? PX_PER_HOUR) / 60

  const baseStartMin = scheduledStart.getHours() * 60 + scheduledStart.getMinutes()
  const taskStartMin = dragOverrideStartMin ?? baseStartMin

  const dayVisStart = dayOffset
  const dayVisEnd   = dayOffset + DAY_MINS

  // Connector spans the full visible workflow portion (busy + available).
  // Account for cumulative delta from flex adjustments cascading through steps.
  const lastStepEnd = (() => {
    const sorted = [...steps].sort((a, b) => a.startOffset - b.startOffset)
    let cum = 0
    let maxEnd = 0
    for (const s of sorted) {
      const dur = s.scheduledDuration ?? s.duration
      maxEnd = Math.max(maxEnd, s.startOffset + cum + dur)
      const delta = dur - s.duration
      if (delta !== 0) cum += delta
    }
    return maxEnd
  })()
  const connAbsStart = Math.max(taskStartMin, dayVisStart)
  const connAbsEnd   = Math.min(taskStartMin + lastStepEnd, dayVisEnd)
  const connTop      = (connAbsStart - dayVisStart) * PX_PER_MIN
  const connHeight   = Math.max((connAbsEnd - connAbsStart) * PX_PER_MIN, 0)

  const colW    = 100 / maxCols
  const colLeft = `calc(${col * colW}% + 1px)`
  const colWidth = `calc(${colW}% - 2px)`

  const sortedSteps = [...steps].sort((a, b) => a.startOffset - b.startOffset)

  // Build cumulative delta map: when a flexible step is stretched/compressed,
  // all subsequent steps shift by the same amount (cascade effect).
  const cumulativeDeltaMap = new Map<string, number>()
  {
    let cum = 0
    for (const s of sortedSteps) {
      cumulativeDeltaMap.set(s.id, cum)
      const dur = s.scheduledDuration ?? s.duration
      const delta = dur - s.duration
      if (delta !== 0) cum += delta
    }
  }

  // Resolve each step's visible slice — using scheduledDuration + cumulative delta
  const visibleSteps = sortedSteps
    .map(s => {
      const dur      = s.scheduledDuration ?? s.duration
      const cumDelta = cumulativeDeltaMap.get(s.id) ?? 0
      const absStart = taskStartMin + s.startOffset + cumDelta
      const absEnd   = absStart + dur
      const visStart = Math.max(absStart, dayVisStart)
      const visEnd   = Math.min(absEnd, dayVisEnd)
      if (visEnd <= visStart) return null
      return {
        s,
        dur,
        sTop:    (visStart - dayVisStart) * PX_PER_MIN,
        sHeight: Math.max((visEnd - visStart) * PX_PER_MIN, 2),
      }
    })
    .filter(Boolean) as Array<{ s: StepData; dur: number; sTop: number; sHeight: number }>

  if (!visibleSteps.length || connHeight === 0) return null

  const deadlineLabel  = task.deadline
    ? new Date(task.deadline).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    : null
  const textColor      = conflict ? '#7F1D1D' : darkenHex(color)
  const firstStep      = visibleSteps[0]
  const isContinuation = dayOffset > 0

  const PRIORITY_LABELS = { critical: '!', normal: '', low: '↓' }
  const priorityMark = task.priority !== 'normal' ? PRIORITY_LABELS[task.priority] : ''

  const ghostFactor = isDragGhost ? 0.6 : 1

  return (
    <>
      {/* Drag time labels (for drag-and-drop preview) */}
      {dragTimeLabels && connHeight > 0 && (
        <div
          className="absolute pointer-events-none flex justify-center"
          style={{
            top:    `${Math.max(connTop - 16, 0)}px`,
            left:   colLeft,
            width:  colWidth,
            zIndex: 30,
          }}
        >
          <span
            className="inline-flex items-center rounded-[4px] px-1.5 py-[1px] text-[9px] font-[600] font-nb-mono bg-white/95 shadow-sm"
            style={{ color: borderC }}
          >
            {dragTimeLabels.start} — {dragTimeLabels.end}
          </span>
        </div>
      )}

      {/* Connector line */}
      <div
        className="absolute pointer-events-none"
        style={{
          top:             `${connTop}px`,
          height:          `${connHeight}px`,
          left:            colLeft,
          width:           '2.5px',
          backgroundColor: borderC,
          opacity:         ghostFactor,
          zIndex:          10,
        }}
      />

      {/* Invisible hitbox so you can grab the task between steps */}
      <div
        className="absolute cursor-pointer"
        style={{
          top:    `${connTop}px`,
          height: `${connHeight}px`,
          left:   colLeft,
          width:  colWidth,
          zIndex: 15,
          pointerEvents: isDragGhost ? 'none' : 'auto',
          backgroundColor: 'transparent',
          opacity: ghostFactor,
        }}
        onClick={e => { e.stopPropagation(); onClick?.(task) }}
        onMouseDown={e => { e.stopPropagation(); onMouseDown?.(e) }}
      />

      {/* Busy step blocks — available steps show only via labels */}
      {visibleSteps.filter(v => v.s.stepType === 'busy').map(({ s, dur, sTop, sHeight }) => {
        const isAvailable = false
        const labelSize   = sHeight >= 14 ? 8 : sHeight >= 8 ? 7 : 6
        const isHovered   = hoveredStepId === s.id

        return (
          <div
            key={s.id}
            className="absolute flex flex-col overflow-hidden cursor-pointer"
            style={{
              top:    `${sTop}px`,
              height: `${sHeight}px`,
              left:   colLeft,
              width:  colWidth,
              // Busy: solid tinted background. Available: hatched at reduced opacity.
              background: conflict
                ? '#FEF2F2'
                : isAvailable
                  ? hatchedBg(color)
                  : mixWithWhite(color, 0.9),
              borderLeft:  `2.5px solid ${borderC}`,
              borderTop:   `1px solid ${conflict ? '#EF444433' : hexToRgba(color, 0.25)}`,
              borderRight: `1px solid ${conflict ? '#EF444433' : hexToRgba(color, 0.15)}`,
              borderBottom:`1px solid ${conflict ? '#EF444433' : hexToRgba(color, 0.15)}`,
              borderRadius:'0 4px 4px 0',
              zIndex:      20,
              transition:  'opacity 0.1s',
              opacity:     (isAvailable ? 0.75 : 1) * ghostFactor,
            }}
            onClick={e => { e.stopPropagation(); onClick?.(task, s.id) }}
            onMouseDown={e => { e.stopPropagation(); onMouseDown?.(e) }}
            onMouseEnter={() => setHoveredStepId(s.id)}
            onMouseLeave={() => setHoveredStepId(prev => prev === s.id ? null : prev)}
          >
            <div className="flex items-center gap-0.5 px-1 flex-1 min-h-0 overflow-hidden">
              {isAvailable && sHeight >= 10 && (
                <span style={{ color: textColor, fontSize: `${labelSize}px`, opacity: 0.7, flexShrink: 0 }}>~</span>
              )}
              <span
                className="font-nb-mono truncate leading-none"
                style={{ color: textColor, fontSize: `${labelSize}px` }}
              >
                {isAvailable
                  ? `${s.name || 'Wait'} (${dur}min)`
                  : s.name}
              </span>
            </div>

            {/* Hover glow */}
            {isHovered && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: mixWithWhite(color, 0.82), borderRadius: '0 4px 4px 0' }}
              />
            )}
          </div>
        )
      })}

      {/* Available step blocks — 1/3 column width */}
      {visibleSteps.filter(v => v.s.stepType === 'available').map(({ s, sTop, sHeight }) => {
        const availWidth = `calc(${colW / 3}% - 2px)`
        const labelSize  = sHeight >= 14 ? 8 : sHeight >= 8 ? 7 : 6
        const isHovered  = hoveredStepId === s.id

        return (
          <div
            key={`avail-${s.id}`}
            className="absolute flex flex-col overflow-hidden cursor-pointer"
            style={{
              top:         `${sTop}px`,
              height:      `${sHeight}px`,
              left:        colLeft,
              width:       availWidth,
              background:  conflict ? '#FEF2F2' : hatchedBg(color),
              borderLeft:  `2.5px solid ${borderC}`,
              borderTop:   `1px solid ${conflict ? '#EF444433' : hexToRgba(color, 0.25)}`,
              borderRight: `1px solid ${conflict ? '#EF444433' : hexToRgba(color, 0.15)}`,
              borderBottom:`1px solid ${conflict ? '#EF444433' : hexToRgba(color, 0.15)}`,
              borderRadius:'0 4px 4px 0',
              zIndex:      20,
              transition:  'opacity 0.1s',
            }}
            onClick={e => { e.stopPropagation(); onClick?.(task, s.id) }}
            onMouseDown={e => { e.stopPropagation(); onMouseDown?.(e) }}
            onMouseEnter={() => setHoveredStepId(s.id)}
            onMouseLeave={() => setHoveredStepId(prev => prev === s.id ? null : prev)}
          >
            {sHeight >= 8 && (
              <div className="flex items-center gap-0.5 px-1 flex-1 min-h-0 overflow-hidden">
                <span style={{ color: textColor, fontSize: `${labelSize}px`, opacity: 0.7, flexShrink: 0 }}>~</span>
                <span
                  className="font-nb-mono truncate leading-none"
                  style={{ color: textColor, fontSize: `${labelSize}px` }}
                >
                  {s.name || 'Available'}
                </span>
              </div>
            )}

            {isHovered && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: mixWithWhite(color, 0.82), borderRadius: '0 4px 4px 0' }}
              />
            )}
          </div>
        )
      })}

      {/* Tooltip on hover */}
      {hoveredStepId && (() => {
        const hoveredStep    = sortedSteps.find(s => s.id === hoveredStepId)
        const hoveredVisible = visibleSteps.find(v => v.s.id === hoveredStepId)
        if (!hoveredStep || !hoveredVisible) return null

        const stepDur = hoveredStep.scheduledDuration ?? hoveredStep.duration
        const stepStartDate = new Date(scheduledStart.getTime() + hoveredStep.startOffset * 60_000)
        const stepEndDate   = new Date(stepStartDate.getTime() + stepDur * 60_000)
        const stepStartLabel = formatTimeLabel(stepStartDate)
        const stepEndLabel   = formatTimeLabel(stepEndDate)

        return (
          <div
            className="absolute z-50 bg-pl-charcoal text-white rounded-[6px] px-2.5 py-1.5 shadow-xl font-nb-mono pointer-events-none"
            style={{
              top:      `${hoveredVisible.sTop + hoveredVisible.sHeight + 6}px`,
              left:     colLeft,
              width:    'auto',
              fontSize: '10px',
              whiteSpace: 'nowrap',
            }}
          >
            <p className="text-[10px] font-[600]">{hoveredStep.name || '—'}</p>
            <p className="text-[9px] text-pl-muted-light">{stepStartLabel} – {stepEndLabel}</p>
          </div>
        )
      })()}
    </>
  )
}
