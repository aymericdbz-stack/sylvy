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
}: TaskBlockProps) {
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null)
  const { task, scheduledStart, conflict, conflictReason } = block
  const steps   = task.steps as StepData[]
  const color   = task.color ?? '#F97316'
  const borderC = conflict ? '#EF4444' : color

  const PX_PER_MIN = (pxPerHour ?? PX_PER_HOUR) / 60

  const taskStartMin = scheduledStart.getHours() * 60 + scheduledStart.getMinutes()

  const dayVisStart = dayOffset
  const dayVisEnd   = dayOffset + DAY_MINS

  // Connector spans the full visible workflow portion (busy + available)
  const lastStepEnd  = steps.reduce((acc, s) => {
    const dur = s.scheduledDuration ?? s.duration
    return Math.max(acc, s.startOffset + dur)
  }, 0)
  const connAbsStart = Math.max(taskStartMin, dayVisStart)
  const connAbsEnd   = Math.min(taskStartMin + lastStepEnd, dayVisEnd)
  const connTop      = (connAbsStart - dayVisStart) * PX_PER_MIN
  const connHeight   = Math.max((connAbsEnd - connAbsStart) * PX_PER_MIN, 0)

  const colW    = 100 / maxCols
  const colLeft = `calc(${col * colW}% + 1px)`
  const colWidth = `calc(${colW}% - 2px)`

  const sortedSteps = [...steps].sort((a, b) => a.startOffset - b.startOffset)

  // Resolve each step's visible slice — using scheduledDuration for flexible available steps
  const visibleSteps = sortedSteps
    .map(s => {
      const dur      = s.scheduledDuration ?? s.duration
      const absStart = taskStartMin + s.startOffset
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

  return (
    <>
      {/* Connector line */}
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
              opacity:     isAvailable ? 0.75 : 1,
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

      {/* Available step labels — no boxes, just text at start */}
      {visibleSteps.filter(v => v.s.stepType === 'available').map(({ s, sTop }) => (
        <div
          key={`avail-${s.id}`}
          className="absolute pointer-events-none"
          style={{
            top:    `${sTop + 1}px`,
            left:   `calc(${colLeft} + 4px)`,
            width:  `calc(${colWidth} - 6px)`,
            zIndex: 21,
          }}
        >
          <span
            className="text-[10px] font-[600] font-nb-mono truncate block"
            style={{ color: textColor, opacity: 0.75, lineHeight: '12px' }}
          >
            {s.name || 'Available'}
          </span>
        </div>
      ))}

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
        const isAvail = hoveredStep.stepType === 'available'
        const typeLabel = isAvail
          ? `Available · ${hoveredStep.availableType}`
          : 'Busy'

        return (
          <div
            className="absolute z-50 bg-pl-charcoal text-white rounded-[6px] px-3 py-2.5 shadow-xl font-nb-mono pointer-events-none"
            style={{
              top:   `${hoveredVisible.sTop + hoveredVisible.sHeight + 6}px`,
              left:  colLeft,
              width: '240px',
              fontSize: '10px',
            }}
          >
            {/* Task header */}
            <div className="flex items-center gap-1.5 mb-1.5">
              {task.placement === 'manual'
                ? <Hand size={10} className="text-pl-muted-light flex-shrink-0" />
                : <Sparkles size={10} className="text-pl-orange flex-shrink-0" />
              }
              <p className="font-[700] text-[11px] truncate">{task.name}</p>
              {task.priority !== 'normal' && (
                <span className={`text-[9px] font-[600] px-1.5 py-0.5 rounded-[3px] flex-shrink-0 ${
                  task.priority === 'critical' ? 'bg-red-500' : 'bg-pl-muted'
                }`}>
                  {task.priority}
                </span>
              )}
            </div>

            {deadlineLabel && (
              <p className="text-[9px] text-pl-muted-light mb-1">Deadline: {deadlineLabel}</p>
            )}

            {conflict && conflictReason && (
              <p className="text-[9px] text-red-300 mb-1.5 flex items-center gap-1">
                <AlertTriangle size={9} className="flex-shrink-0" />{conflictReason}
              </p>
            )}

            {/* Current step */}
            <div className="border-t border-white/10 pt-1.5 mt-1 space-y-0.5">
              <p className="text-[9px] font-[600]">{hoveredStep.name || '—'}</p>
              <p className="text-[9px] text-pl-muted-light">{typeLabel}</p>
              <p className="text-[9px] text-pl-muted-light">{stepStartLabel} – {stepEndLabel}</p>
              <p className="text-[9px] text-pl-muted-light">
                T+{minsToHHMM(hoveredStep.startOffset)} · {stepDur}min
                {hoveredStep.scheduledDuration && hoveredStep.scheduledDuration !== hoveredStep.duration
                  ? ` (min: ${hoveredStep.duration}min)`
                  : ''}
              </p>
            </div>

          </div>
        )
      })()}
    </>
  )
}
