/**
 * Scheduling optimizer — pure functions, no UI or database dependencies.
 * Independently testable.
 *
 * Time representation: "absolute minutes since weekStart (Monday 00:00 local time)".
 * All inputs use this representation. Callers convert UTC ISO ↔ absMin.
 */

export type Priority = 'critical' | 'normal' | 'low'

export type FlexDir = '+' | '-' | '+/-'

export interface StepSpec {
  id:            string
  duration:      number            // minutes (min for +/+/-, max for -)
  startOffset:   number            // T+ minutes from task start (design-time)
  stepType:      'busy' | 'available'
  availableType?: 'strict' | 'flexible'
  flexibleDir?:  FlexDir           // default '+'; only for flexible available
  flexibleMax?:  number            // max extra minutes; undefined = snap to next work start
}

export interface SchedulerTask {
  id:                string
  priority:          Priority
  deadline:          number | null  // absMin since weekStart, or null
  placement:         'manual' | 'auto'
  scheduledStartMin: number | null  // null → needs scheduling; non-null → already placed
  steps:             StepSpec[]
}

export interface WorkHours {
  start: number  // e.g., 8  means 08:00
  end:   number  // e.g., 19 means 19:00
}

export interface ResolvedStep {
  id:              string
  absStart:        number  // absolute minute within the week
  actualDuration:  number  // may exceed design-time duration for stretched flexible steps
  stepType:        'busy' | 'available'
  availableType?:  'strict' | 'flexible'
}

export interface PlacementResult {
  id:                string
  scheduledStartMin: number | null
  conflict:          boolean
  conflict_reason:   string | null
  resolvedSteps?:    ResolvedStep[]  // set on success, for persisting stretched durations
}

// ─── Working-hours helpers ─────────────────────────────────────────────────────

/** Day-of-week index within the scheduling window (0=Mon … 4=Fri, 5=Sat, 6=Sun). */
function weekDay(absMin: number): number {
  return Math.floor(absMin / 1440) % 7
}

/** True if absMin falls within Mon-Fri working hours. */
function isWorkingMinute(absMin: number, wh: WorkHours): boolean {
  const d = weekDay(absMin)
  if (d >= 5) return false
  const t = absMin % 1440
  return t >= wh.start * 60 && t < wh.end * 60
}

/**
 * The next absolute minute that is within working hours.
 * If absMin is already in working hours, returns it unchanged.
 */
function nextWorkingStart(absMin: number, wh: WorkHours): number {
  const ws = wh.start * 60
  const we = wh.end * 60

  let d   = Math.floor(absMin / 1440)
  const t = absMin % 1440

  // Already within working hours (weekday only)
  if (d >= 0 && d < 5 && t >= ws && t < we) return absMin

  // Same weekday, before work starts
  if (d >= 0 && d < 5 && t < ws) return d * 1440 + ws

  // After work, on a weekend, or before week start — advance to next Mon-Fri
  d = Math.max(d + 1, 0)
  while (d % 7 === 5 || d % 7 === 6) d++  // skip Sat (5), Sun (6)
  return d * 1440 + ws
}

/**
 * True if the busy step [absStart, absStart+duration) fits entirely within
 * one working day (no overnight overflow).
 */
function isFullyInWorkingHours(absStart: number, duration: number, wh: WorkHours): boolean {
  const d = Math.floor(absStart / 1440)
  if (d >= 5) return false
  const t = absStart % 1440
  if (t < wh.start * 60) return false
  if (t + duration > wh.end * 60) return false
  return true
}

// ─── Step resolution ───────────────────────────────────────────────────────────

interface ResolveSuccess { ok: true;  steps: ResolvedStep[]; totalSpan: number }
interface ResolveFailure  { ok: false }
type ResolveResult = ResolveSuccess | ResolveFailure

/**
 * Walk through each step in T+ order, applying flexible stretching where needed.
 * Returns null if any busy step falls outside working hours.
 *
 * totalSpan = absEnd-of-last-step − taskAbsStart (used for deadline checking).
 */
function resolveSteps(
  taskAbsStart: number,
  steps:        StepSpec[],
  wh:           WorkHours,
): ResolveResult {
  const sorted   = [...steps].sort((a, b) => a.startOffset - b.startOffset)
  const resolved: ResolvedStep[] = []
  let cumulativeAdjust = 0

  for (const step of sorted) {
    const adjustedStart = taskAbsStart + step.startOffset + cumulativeAdjust

    if (step.stepType === 'busy') {
      if (!isFullyInWorkingHours(adjustedStart, step.duration, wh)) return { ok: false }
      resolved.push({
        id: step.id, absStart: adjustedStart,
        actualDuration: step.duration, stepType: 'busy',
      })
    } else {
      // available
      if (step.availableType === 'flexible') {
        const dir = step.flexibleDir ?? '+'
        if (dir === '-') {
          // Can only compress — use stated duration as-is, no stretching
          resolved.push({
            id: step.id, absStart: adjustedStart,
            actualDuration: step.duration, stepType: 'available', availableType: 'flexible',
          })
        } else {
          // '+' or '+/-' — stretch up to flexibleMax (or unlimited → snap to next work start)
          const minAvailEnd    = adjustedStart + step.duration
          const naturalStretch = Math.max(0, nextWorkingStart(minAvailEnd, wh) - minAvailEnd)
          const stretch        = step.flexibleMax != null
            ? Math.min(naturalStretch, step.flexibleMax)
            : naturalStretch
          const actualDuration = step.duration + stretch
          cumulativeAdjust += stretch
          resolved.push({
            id: step.id, absStart: adjustedStart,
            actualDuration, stepType: 'available', availableType: 'flexible',
          })
        }
      } else {
        // strict — fixed duration; next busy step will validate itself
        resolved.push({
          id: step.id, absStart: adjustedStart,
          actualDuration: step.duration, stepType: 'available', availableType: 'strict',
        })
      }
    }
  }

  const last = resolved[resolved.length - 1]
  const totalSpan = last ? (last.absStart - taskAbsStart) + last.actualDuration : 0

  return { ok: true, steps: resolved, totalSpan }
}

// ─── Occupied timeline ─────────────────────────────────────────────────────────

type Interval = [number, number]  // [absStart, absEnd]

function addBusyIntervals(occupied: Interval[], resolved: ResolvedStep[]): Interval[] {
  const extra = resolved
    .filter(s => s.stepType === 'busy')
    .map<Interval>(s => [s.absStart, s.absStart + s.actualDuration])
  return [...occupied, ...extra]
}

// ─── Candidate generation ──────────────────────────────────────────────────────

/** Grid granularity for candidate start times (minutes). Matches planner drag (5 min). */
const CANDIDATE_GRID_MIN = 5

/**
 * Generate candidate start times:
 *   1. 5-minute grid across all Mon-Fri working hours (matches planner drag snap)
 *   2. Current time (snapped to next working minute) — critical for mid-week runs
 *   3. Immediately after each existing busy block ends
 *
 * All candidates are filtered to [nowMin, weekSpan) and within working hours.
 */
function generateCandidates(
  weekSpan: number,
  wh:       WorkHours,
  occupied: Interval[],
  nowMin = 0,
): number[] {
  const set = new Set<number>()
  const ws = wh.start * 60
  const we = wh.end   * 60

  // 5-minute grid across Mon-Fri working hours (smooth placement, no 15/30-min jump)
  for (let d = 0; d < 5; d++) {
    for (let t = ws; t < we; t += CANDIDATE_GRID_MIN) {
      set.add(d * 1440 + t)
    }
  }

  // Snap to next working minute from now — ensures remaining time today is usable
  const nowCandidate = nextWorkingStart(Math.ceil(nowMin), wh)
  set.add(nowCandidate)

  // Immediately after each busy block ends
  for (const [, end] of occupied) {
    set.add(end)
    // Also snap to next working start in case the block ends outside working hours
    set.add(nextWorkingStart(Math.ceil(end), wh))
  }

  return [...set]
    .filter(c => c >= nowMin && c < weekSpan && isWorkingMinute(c, wh))
    .sort((a, b) => a - b)
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

const MAX_DAILY_BUSY = 9 * 60  // 9 hours threshold before penalty

function computeDailyBusy(occupied: Interval[]): number[] {
  const d = [0, 0, 0, 0, 0]
  for (const [s, e] of occupied) {
    const day = Math.floor(s / 1440)
    if (day >= 0 && day < 5) d[day] += e - s
  }
  return d
}

function scoreCandidate(
  candidateAbsStart: number,
  resolved:          ResolvedStep[],
  task:              SchedulerTask,
  occupied:          Interval[],
  wh:                WorkHours,
): number {
  let score = 0
  const dayBusy    = computeDailyBusy(occupied)
  const placDay    = Math.floor(candidateAbsStart / 1440)
  const nonZero    = dayBusy.filter(b => b > 0)
  const weekAvg    = nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0

  // ── Day balance: favor underloaded days ───────────────────────────────
  score += (weekAvg - (dayBusy[placDay] ?? 0)) * 0.5

  // ── Max daily threshold penalty ───────────────────────────────────────
  const taskBusyOnDay = resolved
    .filter(s => s.stepType === 'busy' && Math.floor(s.absStart / 1440) === placDay)
    .reduce((acc, s) => acc + s.actualDuration, 0)
  if ((dayBusy[placDay] ?? 0) + taskBusyOnDay > MAX_DAILY_BUSY) score -= 10_000

  // ── Deadline margin bonus ─────────────────────────────────────────────
  if (task.deadline !== null) {
    const lastBusyEnd = resolved
      .filter(s => s.stepType === 'busy')
      .reduce((acc, s) => Math.max(acc, s.absStart + s.actualDuration), candidateAbsStart)
    const marginMin = task.deadline - lastBusyEnd
    if (marginMin < 0) score -= 5_000
    else               score += Math.min(100, marginMin / 60)
  }

  // ── Gap penalty: < 30 min gaps are useless ────────────────────────────
  const taskEnd = resolved
    .filter(s => s.stepType === 'busy')
    .reduce((acc, s) => Math.max(acc, s.absStart + s.actualDuration), candidateAbsStart)
  for (const [bStart, bEnd] of occupied) {
    const gapBefore = candidateAbsStart - bEnd
    if (gapBefore > 0 && gapBefore < 30) score -= 20
    const gapAfter = bStart - taskEnd
    if (gapAfter > 0 && gapAfter < 30) score -= 20
  }

  // ── Earliness within the day ──────────────────────────────────────────
  const tod         = candidateAbsStart % 1440
  const dayWorkSpan = (wh.end - wh.start) * 60
  score += ((dayWorkSpan - (tod - wh.start * 60)) / dayWorkSpan) * 10

  // ── Week earliness: gentle preference for earlier days ────────────────
  // Ensures tasks don't unnecessarily pile up at end of week when
  // earlier days (or the remaining hours of today) are available.
  score -= Math.floor(candidateAbsStart / 1440) * 5

  return score
}

// ─── Sort tasks before placement ──────────────────────────────────────────────

const PRIO: Record<Priority, number> = { critical: 1, normal: 2, low: 3 }

function sortTasks(tasks: SchedulerTask[]): SchedulerTask[] {
  return [...tasks].sort((a, b) => {
    const pd = PRIO[a.priority] - PRIO[b.priority]
    if (pd !== 0) return pd

    // Both have deadline: earliest first
    if (a.deadline !== null && b.deadline !== null) return a.deadline - b.deadline
    if (a.deadline !== null) return -1
    if (b.deadline !== null) return  1

    // No deadline: longest total busy duration first (bin packing)
    const aBusy = a.steps.filter(s => s.stepType === 'busy').reduce((acc, s) => acc + s.duration, 0)
    const bBusy = b.steps.filter(s => s.stepType === 'busy').reduce((acc, s) => acc + s.duration, 0)
    return bBusy - aBusy
  })
}

// ─── Main entry points ────────────────────────────────────────────────────────

/**
 * Schedule all auto tasks in the week from scratch.
 * Manual tasks (placement === 'manual') are fixed constraints.
 * Auto tasks with an existing scheduled_start are CLEARED and re-placed.
 *
 * @param tasks     All tasks for the week (manual + auto).
 * @param wh        Working hours.
 * @param weekSpan  Scheduling window in minutes (default: 7 × 1440).
 * @returns         Placement result for every auto task.
 */
export function scheduleWeek(
  tasks:    SchedulerTask[],
  wh:       WorkHours,
  weekSpan  = 7 * 1440,
  nowMin    = 0,
): PlacementResult[] {
  // Pre-fill occupied from manual tasks only (auto are being re-scheduled)
  let occupied: Interval[] = []
  for (const t of tasks) {
    if (t.placement !== 'manual' || t.scheduledStartMin === null) continue
    const res = resolveSteps(t.scheduledStartMin, t.steps, wh)
    if (res.ok) occupied = addBusyIntervals(occupied, res.steps)
  }

  // Auto tasks with no scheduled_start (cleared before calling this)
  const toSchedule = sortTasks(
    tasks.filter(t => t.placement === 'auto' && t.scheduledStartMin === null)
  )

  const results: PlacementResult[] = []

  for (const task of toSchedule) {
    const [result, newOccupied] = placeOne(task, occupied, wh, weekSpan, nowMin)
    if (newOccupied) occupied = newOccupied
    results.push(result)
  }

  return results
}

/**
 * Schedule a single new task while treating ALL existing placed tasks as constraints.
 * Used when adding a task mid-week without disturbing existing placements.
 */
export function scheduleOneTask(
  newTask:  SchedulerTask,
  allTasks: SchedulerTask[],
  wh:       WorkHours,
  weekSpan  = 7 * 1440,
  nowMin    = 0,
): PlacementResult {
  let occupied: Interval[] = []
  for (const t of allTasks) {
    if (t.id === newTask.id || t.scheduledStartMin === null) continue
    const res = resolveSteps(t.scheduledStartMin, t.steps, wh)
    if (res.ok) occupied = addBusyIntervals(occupied, res.steps)
  }

  const [result] = placeOne(newTask, occupied, wh, weekSpan, nowMin)
  return result
}

// ─── Core placement routine ────────────────────────────────────────────────────

function placeOne(
  task:     SchedulerTask,
  occupied: Interval[],
  wh:       WorkHours,
  weekSpan: number,
  nowMin = 0,
): [PlacementResult, Interval[] | null] {
  const candidates = generateCandidates(weekSpan, wh, occupied, nowMin)

  let bestStart:    number | null       = null
  let bestScore:    number              = -Infinity
  let bestResolved: ResolvedStep[] | null = null
  let anyValidExists = false

  for (const c of candidates) {
    const resolved = resolveSteps(c, task.steps, wh)
    if (!resolved.ok) continue

    // Overlap check: no busy step may overlap with an already-occupied interval
    const hasOverlap = resolved.steps
      .filter(s => s.stepType === 'busy')
      .some(s => occupied.some(([os, oe]) => s.absStart < oe && s.absStart + s.actualDuration > os))
    if (hasOverlap) continue

    anyValidExists = true

    // Deadline check
    if (task.deadline !== null) {
      const lastBusyEnd = resolved.steps
        .filter(s => s.stepType === 'busy')
        .reduce((acc, s) => Math.max(acc, s.absStart + s.actualDuration), c)
      if (lastBusyEnd > task.deadline) continue
    }

    const sc = scoreCandidate(c, resolved.steps, task, occupied, wh)
    if (sc > bestScore) {
      bestScore    = sc
      bestStart    = c
      bestResolved = resolved.steps
    }
  }

  if (bestStart === null || bestResolved === null) {
    let reason: string
    if (!anyValidExists) {
      reason = 'No available slot this week'
    } else {
      const dlDate = task.deadline !== null
        ? new Date(task.deadline).toLocaleDateString('en-US', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        : ''
      reason = `Cannot complete before deadline of ${dlDate}`
    }
    return [
      { id: task.id, scheduledStartMin: null, conflict: true, conflict_reason: reason },
      null,
    ]
  }

  const newOccupied = addBusyIntervals(occupied, bestResolved)
  return [
    {
      id:                task.id,
      scheduledStartMin: bestStart,
      conflict:          false,
      conflict_reason:   null,
      resolvedSteps:     bestResolved,
    },
    newOccupied,
  ]
}
