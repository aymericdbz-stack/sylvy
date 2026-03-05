/**
 * Intercalation Engine for Sylvy Lab Planner
 *
 * Pure function that resolves busy-step overlaps between templates
 * by adjusting flexible available steps or sliding templates to free slots.
 *
 * Performance target: <16ms for 10+ templates (greedy heuristic).
 */

import type { StepData } from '../hooks/usePlannerTasks'

// ── Public types ───────────────────────────────────────────────────────────────

export interface WorkHours {
  start: number // hour (0-24)
  end: number   // hour (0-24)
}

export interface TaskPlacement {
  taskId: string
  startMin: number // minutes from midnight (0-1440)
  steps: StepData[]
}

export interface IntercalationResult {
  /** All tasks with final positions and adjusted steps */
  placements: TaskPlacement[]
  /** True if the new task was shifted from its requested position */
  moved: boolean
  /** Short toast message when task was moved */
  message?: string
}

export interface OvernightExpansion {
  stepId: string
  /** New scheduledDuration for the overnight step (covers the full night gap) */
  expandedDuration: number
  /** Whether this overnight spans a weekend (Fri→Mon) */
  crossesWeekend: boolean
}

// ── Internal types ─────────────────────────────────────────────────────────────

interface BusyInterval {
  taskId: string
  stepId: string
  start: number // absolute minutes from midnight
  end: number
}

interface Overlap {
  a: BusyInterval
  b: BusyInterval
  amount: number
}

// ── Effective interval computation ─────────────────────────────────────────────

/**
 * Compute absolute-minute positions for all steps of a task, accounting for
 * cumulative duration deltas from adjusted flexible steps that cascade
 * to subsequent steps.
 */
export function getEffectiveStepPositions(
  startMin: number,
  steps: StepData[],
): Array<{ step: StepData; start: number; end: number }> {
  const sorted = [...steps].sort((a, b) => a.startOffset - b.startOffset)
  const result: Array<{ step: StepData; start: number; end: number }> = []
  let cumulativeDelta = 0

  for (const step of sorted) {
    const dur = step.scheduledDuration ?? step.duration
    const start = startMin + step.startOffset + cumulativeDelta
    const end = start + dur

    result.push({ step, start, end })

    // Accumulate delta from duration adjustments (stretch/compress)
    const delta = dur - step.duration
    if (delta !== 0) cumulativeDelta += delta
  }

  return result
}

/**
 * Extract only busy intervals from a task placement.
 */
function getBusyIntervals(p: TaskPlacement): BusyInterval[] {
  return getEffectiveStepPositions(p.startMin, p.steps)
    .filter(({ step }) => step.stepType === 'busy')
    .map(({ step, start, end }) => ({
      taskId: p.taskId,
      stepId: step.id,
      start,
      end,
    }))
}

// ── Overlap detection ──────────────────────────────────────────────────────────

function detectOverlaps(placements: TaskPlacement[]): Overlap[] {
  const allBusy: BusyInterval[] = []
  for (const p of placements) {
    allBusy.push(...getBusyIntervals(p))
  }
  allBusy.sort((a, b) => a.start - b.start)

  const result: Overlap[] = []
  for (let i = 0; i < allBusy.length; i++) {
    for (let j = i + 1; j < allBusy.length; j++) {
      if (allBusy[j].start >= allBusy[i].end) break
      if (allBusy[i].taskId === allBusy[j].taskId) continue

      const overlapStart = Math.max(allBusy[i].start, allBusy[j].start)
      const overlapEnd = Math.min(allBusy[i].end, allBusy[j].end)
      const amount = overlapEnd - overlapStart
      if (amount > 0) {
        result.push({ a: allBusy[i], b: allBusy[j], amount })
      }
    }
  }
  return result
}

// ── Grid granularity ──────────────────────────────────────────────────────────

/** Grid granularity for task start (minutes). Must match planner drag snap. */
const SNAP_MINUTES = 5

function snapToGrid(min: number): number {
  return Math.round(min / SNAP_MINUTES) * SNAP_MINUTES
}

// ── Overnight expansion ──────────────────────────────────────────────────────

/**
 * Walk through a task's steps at a given startMin and detect which overnight
 * steps cross working-hours boundaries. For each, compute the expanded duration
 * that covers the full night gap so subsequent steps resume at next-day WH start.
 *
 * @param startMin       Task start in minutes from midnight
 * @param steps          The task's steps (not mutated)
 * @param workHours      User's working hours
 * @param startDayOfWeek 0=Sun … 6=Sat — the day of week for the task's start date
 * @param includeWeekends Whether weekends are working days
 */
export function computeOvernightExpansions(
  startMin: number,
  steps: StepData[],
  workHours: WorkHours,
  startDayOfWeek: number,
  includeWeekends: boolean,
): OvernightExpansion[] {
  const whStartMin = workHours.start * 60
  const whEndMin = workHours.end * 60
  const nightGap = (24 * 60 - whEndMin) + whStartMin // minutes from WH end to next WH start

  const positions = getEffectiveStepPositions(startMin, steps)
  const expansions: OvernightExpansion[] = []

  // Track cumulative extra delta from previous expansions in this pass
  let extraDelta = 0
  // Track which "logical day" we're on (0 = start day, 1 = next day, etc.)
  let currentDay = 0

  for (const { step, start: rawStart, end: rawEnd } of positions) {
    const start = rawStart + extraDelta
    const end = rawEnd + extraDelta

    // Current day's WH boundaries (shifted by overnight crossings)
    const dayWhEnd = currentDay * 1440 + whEndMin
    const dayWhStart = currentDay * 1440 + whStartMin

    // Check drag DOWN: step crosses end of current day's WH
    if (end > dayWhEnd && start < dayWhEnd) {
      if (step.overnight) {
        // Compute how many weekend days to skip
        const stepDayOfWeek = (startDayOfWeek + currentDay) % 7
        let weekendDays = 0
        let crossesWeekend = false
        if (!includeWeekends) {
          // Check if the night crosses into weekend days
          let checkDay = (stepDayOfWeek + 1) % 7
          while (checkDay === 0 || checkDay === 6) {
            weekendDays++
            checkDay = (checkDay + 1) % 7
            crossesWeekend = true
          }
        }

        const totalNightGap = nightGap + weekendDays * 1440
        // The step's time before WH end
        const timeBeforeEnd = dayWhEnd - start
        // Expanded duration = time before WH end + total night gap
        // The step finishes exactly at next business day's WH start
        const expandedDuration = timeBeforeEnd + totalNightGap

        expansions.push({
          stepId: step.id,
          expandedDuration,
          crossesWeekend,
        })

        // Shift subsequent steps: the expansion adds extra time
        const originalDur = step.scheduledDuration ?? step.duration
        extraDelta += expandedDuration - originalDur

        // Move to next logical day
        currentDay += 1 + weekendDays
      } else {
        // Non-overnight step crosses WH end → blocked, stop here
        break
      }
    }

    // Check drag UP: step crosses start of current day's WH
    if (start < dayWhStart && end > dayWhStart) {
      if (step.overnight) {
        // Going backward into previous evening
        const stepDayOfWeek = (startDayOfWeek + currentDay) % 7
        let weekendDays = 0
        let crossesWeekend = false
        if (!includeWeekends) {
          let checkDay = (stepDayOfWeek - 1 + 7) % 7
          while (checkDay === 0 || checkDay === 6) {
            weekendDays++
            checkDay = (checkDay - 1 + 7) % 7
            crossesWeekend = true
          }
        }

        const totalNightGap = nightGap + weekendDays * 1440
        // The step's time after WH start
        const timeAfterStart = end - dayWhStart
        const expandedDuration = timeAfterStart + totalNightGap

        expansions.push({
          stepId: step.id,
          expandedDuration,
          crossesWeekend,
        })

        const originalDur = step.scheduledDuration ?? step.duration
        extraDelta += expandedDuration - originalDur
      } else {
        break
      }
    }
  }

  return expansions
}

/**
 * Compute the maximum drag extent for overnight-aware clamping.
 * Returns the furthest startMin allowed, or null if no overnight step exists
 * (meaning default clamp should apply).
 */
export function computeOvernightDragLimits(
  steps: StepData[],
  workHours: WorkHours,
  dayStartMin: number,
  dayEndMin: number,
): { maxStart: number; minStart: number } | null {
  const whStartMin = workHours.start * 60
  const whEndMin = workHours.end * 60

  const sorted = [...steps].sort((a, b) => a.startOffset - b.startOffset)

  // Find the first overnight step — this determines the drag limit
  let hasOvernight = false
  let firstOvernightOffset = 0
  let cumulativeDelta = 0

  for (const step of sorted) {
    const dur = step.scheduledDuration ?? step.duration
    if (step.overnight) {
      hasOvernight = true
      firstOvernightOffset = step.startOffset + cumulativeDelta
      break
    }
    const delta = dur - step.duration
    if (delta !== 0) cumulativeDelta += delta
  }

  if (!hasOvernight) return null

  // Max start: the overnight step must start at least SNAP_MINUTES before WH end
  const maxStart = whEndMin - firstOvernightOffset - SNAP_MINUTES

  // Min start: for drag up, find the last overnight step and ensure it ends
  // at least SNAP_MINUTES after WH start. For simplicity, keep normal min.
  const minStart = dayStartMin

  return { maxStart, minStart }
}

// ── Working-hours validation ───────────────────────────────────────────────────

/**
 * Check that all busy steps fit within working hours.
 * Supports multi-day tasks: busy steps with positions >1440 are checked
 * against the corresponding day's WH window.
 */
function placementBusyStepsFitWorkHours(p: TaskPlacement, workHours: WorkHours): boolean {
  const whStartMin = workHours.start * 60
  const whEndMin = workHours.end * 60

  const positions = getEffectiveStepPositions(p.startMin, p.steps)
  let hasBusy = false
  for (const { step, start, end } of positions) {
    // Skip overnight available steps — they're allowed to cross WH
    if (step.overnight && step.stepType !== 'busy') continue
    if (step.stepType !== 'busy') continue
    hasBusy = true

    // Determine which logical day this busy step falls on
    const dayIndex = Math.floor(start / 1440)
    const dayWhStart = dayIndex * 1440 + whStartMin
    const dayWhEnd = dayIndex * 1440 + whEndMin

    if (start < dayWhStart) return false
    if (end > dayWhEnd) return false
  }
  // If there are no busy steps, still enforce that the task's start time is within working hours.
  if (!hasBusy) {
    if (p.startMin < 0 || p.startMin > 1440) return false
    return p.startMin >= whStartMin && p.startMin < whEndMin
  }
  return true
}

// ── Placements for a given day (including overflow from previous days) ────────

export interface ScheduledBlock {
  task: { id: string; steps: StepData[] }
  scheduledStart: Date
}

/**
 * Build TaskPlacement[] for a single day for use with solveIntercalation.
 * Includes tasks that start on that day and "overflow" placements for tasks
 * that started on a previous day but have busy steps on the target day.
 */
export function getPlacementsForDay(
  blocks: ScheduledBlock[],
  dayISO: string,
  excludeTaskId?: string,
): TaskPlacement[] {
  const placements: TaskPlacement[] = []
  const dayDate = new Date(dayISO + 'T00:00:00')

  for (const block of blocks) {
    if (block.task.id === excludeTaskId) continue

    const startDate = new Date(block.scheduledStart)
    const startDateISO = startDate.getFullYear() + '-' +
      String(startDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(startDate.getDate()).padStart(2, '0')
    const startMinOfDay = startDate.getHours() * 60 + startDate.getMinutes()

    const startDayTime = new Date(startDateISO + 'T00:00:00').getTime()
    const targetDayTime = dayDate.getTime()
    const daysDiff = Math.round((targetDayTime - startDayTime) / 86400000)

    if (daysDiff < 0) continue
    if (daysDiff > 0) {
      // Overflow: task started on a previous day; add synthetic placement for busy segments on dayISO
      // Positions from getEffectiveStepPositions are in "minutes from start day midnight"
      const dayStart = daysDiff * 1440
      const dayEnd = (daysDiff + 1) * 1440
      const positions = getEffectiveStepPositions(startMinOfDay, block.task.steps)
      const busyOnDay: Array<{ start: number; end: number }> = []
      for (const { step, start, end } of positions) {
        if (step.stepType !== 'busy') continue
        const segStart = Math.max(start, dayStart)
        const segEnd = Math.min(end, dayEnd)
        if (segEnd > segStart) {
          busyOnDay.push({ start: segStart - dayStart, end: segEnd - dayStart })
        }
      }
      if (busyOnDay.length === 0) continue
      busyOnDay.sort((a, b) => a.start - b.start)
      const steps: StepData[] = busyOnDay.map((seg, i) => ({
        id: `overflow-${block.task.id}-${dayISO}-${i}`,
        name: '',
        description: '',
        duration: seg.end - seg.start,
        startOffset: seg.start,
        stepType: 'busy' as const,
        availableType: 'flexible' as const,
        overnight: false,
      }))
      const firstStart = busyOnDay[0].start
      placements.push({
        taskId: block.task.id,
        startMin: firstStart,
        steps: steps.map((s, i) => ({
          ...s,
          startOffset: busyOnDay[i].start - firstStart,
        })),
      })
      continue
    }

    // Task starts on this day: full placement
    placements.push({
      taskId: block.task.id,
      startMin: startMinOfDay,
      steps: block.task.steps,
    })
  }

  return placements
}

// ── Flex adjustment ────────────────────────────────────────────────────────────

interface FlexAdjustment {
  step: StepData
  delta: number // positive = stretch, negative = compress
}

/**
 * Find flexible available steps before a given busy step in the same task
 * that can absorb `needed` minutes of adjustment.
 *
 * direction 'stretch': add time → push later steps forward
 * direction 'compress': remove time → pull later steps backward
 *
 * Returns adjustments if the full `needed` amount can be absorbed, null otherwise.
 */
function findFlexAdjustments(
  task: TaskPlacement,
  busyStepId: string,
  needed: number,
  direction: 'stretch' | 'compress',
): FlexAdjustment[] | null {
  const sorted = [...task.steps].sort((a, b) => a.startOffset - b.startOffset)
  const busyIdx = sorted.findIndex(s => s.id === busyStepId)
  if (busyIdx === -1) return null

  let remaining = needed
  const adjustments: FlexAdjustment[] = []

  // Scan backward from the busy step to find flex available steps
  for (let i = busyIdx - 1; i >= 0 && remaining > 0; i--) {
    const s = sorted[i]
    if (s.stepType !== 'available' || s.availableType !== 'flexible') continue

    const currentDur = s.scheduledDuration ?? s.duration

    if (direction === 'stretch') {
      // Can only stretch if flexDir allows '+' or '+/-'
      if (s.flexibleDir === '-') continue
      const alreadyStretched = Math.max(0, currentDur - s.duration)
      const maxExtra = s.flexibleMax != null
        ? Math.max(0, s.flexibleMax - alreadyStretched)
        : 480 // cap at 8 hours if unlimited
      const delta = Math.min(maxExtra, remaining)
      if (delta > 0) {
        adjustments.push({ step: s, delta })
        remaining -= delta
      }
    } else {
      // Can only compress if flexDir allows '-' or '+/-'
      if (s.flexibleDir === '+') continue
      const alreadyCompressed = Math.max(0, s.duration - currentDur)
      const maxCompress = s.flexibleMax != null
        ? Math.max(0, s.flexibleMax - alreadyCompressed)
        : currentDur - 1 // can't go below 1 minute
      const maxAllowed = Math.min(maxCompress, currentDur - 1) // never go below 1 min
      const delta = Math.min(maxAllowed, remaining)
      if (delta > 0) {
        adjustments.push({ step: s, delta: -delta })
        remaining -= delta
      }
    }
  }

  return remaining <= 0 ? adjustments : null
}

/**
 * Apply flex adjustments to steps in-place.
 */
function applyAdjustments(adjustments: FlexAdjustment[]): void {
  for (const adj of adjustments) {
    adj.step.scheduledDuration = (adj.step.scheduledDuration ?? adj.step.duration) + adj.delta
  }
}

/**
 * Undo flex adjustments.
 */
function undoAdjustments(adjustments: FlexAdjustment[]): void {
  for (const adj of adjustments) {
    adj.step.scheduledDuration = (adj.step.scheduledDuration ?? adj.step.duration) - adj.delta
    // Clean up scheduledDuration if it equals the base duration
    if (adj.step.scheduledDuration === adj.step.duration) {
      adj.step.scheduledDuration = undefined
    }
  }
}

/**
 * Try to resolve all overlaps by micro-adjusting flexible available steps.
 * Returns true if all overlaps were resolved.
 */
function tryResolveWithFlex(placements: TaskPlacement[]): boolean {
  for (let iteration = 0; iteration < 5; iteration++) {
    const overlaps = detectOverlaps(placements)
    if (overlaps.length === 0) return true

    let madeProgress = false

    for (const overlap of overlaps) {
      const taskA = placements.find(p => p.taskId === overlap.a.taskId)!
      const taskB = placements.find(p => p.taskId === overlap.b.taskId)!
      const needed = overlap.amount

      // Since intervals are sorted by start, a.start <= b.start.
      // To resolve: push B later (stretch flex before B) or push A earlier (compress flex before A)
      // Try all 4 options, pick the first that works (ordered by preference)

      const attempts: Array<{
        task: TaskPlacement
        busyStepId: string
        direction: 'stretch' | 'compress'
      }> = [
        // Prefer stretching B (pushing it later) — most natural
        { task: taskB, busyStepId: overlap.b.stepId, direction: 'stretch' },
        // Then compressing A (pulling it earlier)
        { task: taskA, busyStepId: overlap.a.stepId, direction: 'compress' },
        // Then stretching A (pushing it later — may cascade)
        { task: taskA, busyStepId: overlap.a.stepId, direction: 'stretch' },
        // Then compressing B (pulling it earlier — may cascade)
        { task: taskB, busyStepId: overlap.b.stepId, direction: 'compress' },
      ]

      for (const attempt of attempts) {
        const adjustments = findFlexAdjustments(
          attempt.task,
          attempt.busyStepId,
          needed,
          attempt.direction,
        )

        if (adjustments) {
          applyAdjustments(adjustments)

          // Verify this didn't create new overlaps worse than before
          const newOverlaps = detectOverlaps(placements)
          if (newOverlaps.length < overlaps.length ||
              (newOverlaps.length === overlaps.length &&
               newOverlaps.reduce((s, o) => s + o.amount, 0) <
               overlaps.reduce((s, o) => s + o.amount, 0))) {
            madeProgress = true
            break
          }

          // Undo — this made things worse
          undoAdjustments(adjustments)
        }
      }

      if (madeProgress) break // restart overlap scan
    }

    if (!madeProgress) return false
  }

  return detectOverlaps(placements).length === 0
}

// ── Nearest free slot finder ───────────────────────────────────────────────────

/**
 * Search outward from the desired position (in 5-min increments) for the
 * nearest slot where the new task has no busy-step overlaps.
 */
function findNearestFreeSlot(
  existingTasks: TaskPlacement[],
  newTask: TaskPlacement,
  desiredStartMin: number,
  workHours: WorkHours,
): number {
  const whStartMin = workHours.start * 60
  const whEndMin = workHours.end * 60

  // Get the span of the new task's busy steps (relative to task start)
  const positions = getEffectiveStepPositions(0, newTask.steps)
  const busyPositions = positions.filter(p => p.step.stepType === 'busy')
  if (busyPositions.length === 0) {
    // No busy steps: clamp start time into the working-hours window.
    const clamped = Math.max(whStartMin, Math.min(whEndMin - SNAP_MINUTES, desiredStartMin))
    return snapToGrid(clamped)
  }

  const firstBusyOffset = busyPositions[0].start
  const lastBusyEnd = busyPositions[busyPositions.length - 1].end

  // Collect all existing busy intervals
  const existingBusy: Array<{ start: number; end: number }> = []
  for (const task of existingTasks) {
    existingBusy.push(...getBusyIntervals(task))
  }
  existingBusy.sort((a, b) => a.start - b.start)

  // Search outward in 5-min steps (matches planner drag snap)
  for (let offset = 0; offset <= 1440; offset += 5) {
    const candidates = offset === 0
      ? [desiredStartMin]
      : [desiredStartMin + offset, desiredStartMin - offset]

    for (const candidate of candidates) {
      // Check working hours: all busy steps must fit
      const candFirstBusy = candidate + firstBusyOffset
      const candLastBusy = candidate + lastBusyEnd
      if (candFirstBusy < whStartMin || candLastBusy > whEndMin) continue

      // Check overlaps
      const testBusy = getBusyIntervals({ ...newTask, startMin: candidate })
      const hasConflict = testBusy.some(tb =>
        existingBusy.some(eb => tb.start < eb.end && tb.end > eb.start),
      )

      if (!hasConflict) return snapToGrid(candidate)
    }
  }

  // Fallback
  return whStartMin
}

// ── Time formatting ────────────────────────────────────────────────────────────

function minToTimeLabel(min: number): string {
  let h = Math.floor(min / 60)
  const m = min % 60
  if (h >= 24) h -= 24
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, '0')} ${period}`
}

// ── Main solver ────────────────────────────────────────────────────────────────

/**
 * Solve intercalation for placing a new (or moved) task among existing tasks.
 *
 * Rules applied:
 * 1. No overlap between busy steps (across all templates)
 * 2. Available steps are "holes" — only busy steps participate in collision
 * 3. Flexible available steps can be stretched/compressed to eliminate overlaps
 * 4. Minimum total movement (greedy, cascade-limited)
 * 5. Working hours enforced for non-overnight steps
 * 6. Graceful fallback to nearest free slot
 */

export function solveIntercalation(input: {
  existingTasks: TaskPlacement[]
  newTask: TaskPlacement
  workHours: WorkHours
}): IntercalationResult {
  const { existingTasks, newTask, workHours } = input

  // Normalise la position demandée sur la grille 5 min (évite les sauts 15/30 min)
  const requestedStart = snapToGrid(newTask.startMin)

  // Deep-clone steps to avoid mutating originals
  const clonedExisting = existingTasks.map(t => ({
    ...t,
    steps: t.steps.map(s => ({ ...s })),
  }))
  const clonedNew: TaskPlacement = {
    ...newTask,
    startMin: requestedStart,
    steps: newTask.steps.map(s => ({ ...s })),
  }

  const allPlacements = [...clonedExisting, clonedNew]

  // Phase 1: Check for overlaps at desired position
  const initialOverlaps = detectOverlaps(allPlacements)
  // Even if there are no overlaps, we must enforce working hours (otherwise users
  // can drop templates into the grey non-working zones).
  if (initialOverlaps.length === 0 && placementBusyStepsFitWorkHours(clonedNew, workHours)) {
    return { placements: allPlacements, moved: false }
  }

  // Phase 2: Try to resolve with flex adjustments
  if (tryResolveWithFlex(allPlacements)) {
    // Flex adjustments may shift busy steps; ensure the resulting placements are still valid.
    const allFit = allPlacements.every(p => placementBusyStepsFitWorkHours(p, workHours))
    if (!allFit) {
      // Fall through to slot search (phase 3) if flex resolution violates working hours.
    } else {
    return { placements: allPlacements, moved: false }
    }
  }

  // Phase 3: Reset adjustments and find nearest free slot
  for (const s of clonedNew.steps) {
    const orig = newTask.steps.find(os => os.id === s.id)
    if (orig) {
      s.scheduledDuration = orig.scheduledDuration
    }
  }
  for (let i = 0; i < clonedExisting.length; i++) {
    for (const s of clonedExisting[i].steps) {
      const orig = existingTasks[i].steps.find(os => os.id === s.id)
      if (orig) {
        s.scheduledDuration = orig.scheduledDuration
      }
    }
  }

  const freeSlot = findNearestFreeSlot(
    clonedExisting,
    clonedNew,
    requestedStart,
    workHours,
  )
  // Garantir que le créneau libre retourné est bien sur la grille 5 min
  clonedNew.startMin = snapToGrid(freeSlot)

  const finalPlacements = [...clonedExisting, clonedNew]
  const wasMoved = clonedNew.startMin !== requestedStart

  return {
    placements: finalPlacements,
    moved: wasMoved,
    message: wasMoved ? `Moved to ${minToTimeLabel(clonedNew.startMin)}` : undefined,
  }
}
