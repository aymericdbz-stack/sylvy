// ── Planner scheduler — pure TS, zero UI / Supabase deps ─────────────────────
// Three-phase algorithm:
//   Phase 1 — Preprocessing: separate manual tasks, sort auto tasks by deadline then duration
//   Phase 2 — Greedy placement with 5-candidate scoring + limited backtracking
//   Phase 3 — Balance pass: redistribute tasks across the week

// ── Types ─────────────────────────────────────────────────────────────────────

export type Placement = 'manual' | 'auto'

export interface Step {
  id:          string
  name:        string
  duration:    number       // minutes
  startOffset: number       // T+ minutes from task start
}

export interface Task {
  id:             string
  name:           string
  steps:          Step[]
  placement:      Placement
  deadline?:      Date
  color:          string
  scheduledStart?: Date     // existing placement (manual tasks always have this)
}

export interface ScheduledTaskResult {
  id:              string
  scheduledStart:  Date
  conflict:        boolean
  conflictReason?: string
}

export interface OptimizeResult {
  results:   ScheduledTaskResult[]
  scheduled: number
  conflicts: number
}

// ── Internal helpers ──────────────────────────────────────────────────────────

interface Interval { start: Date; end: Date }

/** Minutes elapsed since midnight */
function minOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

/** Add `min` minutes to date, return new Date */
function addMin(d: Date, min: number): Date {
  return new Date(d.getTime() + min * 60_000)
}

/** True if d is Monday–Friday */
function isWeekday(d: Date): boolean {
  const dow = d.getDay()
  return dow >= 1 && dow <= 5
}

/**
 * Return d advanced to the start of the next working day at workStart.
 * If d is already on a weekday at or before workStart it returns d at workStart.
 */
function nextWorkDayStart(d: Date, workStart: number): Date {
  const r = new Date(d)
  r.setSeconds(0, 0)
  r.setMinutes(0)
  r.setHours(Math.floor(workStart / 60), workStart % 60, 0, 0)
  const dow = r.getDay()
  if (dow === 0) r.setDate(r.getDate() + 1)      // Sun → Mon
  else if (dow === 6) r.setDate(r.getDate() + 2) // Sat → Mon
  return r
}

/** Advance to the next working day (add 1 day, clamp to Monday if needed) */
function advanceToNextWorkDay(d: Date, workStart: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + 1)
  // skip weekend
  const dow = next.getDay()
  if (dow === 0) next.setDate(next.getDate() + 1)
  if (dow === 6) next.setDate(next.getDate() + 2)
  next.setHours(Math.floor(workStart / 60), workStart % 60, 0, 0)
  return next
}

/** ISO date string YYYY-MM-DD */
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Get Monday of the week containing d (Mon = start of week) */
function mondayOf(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  const dow = r.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  r.setDate(r.getDate() + diff)
  return r
}

/**
 * Intervals representing all steps of a task starting at taskStart.
 */
function taskIntervals(taskStart: Date, steps: Step[]): Interval[] {
  return steps.map(s => ({
    start: addMin(taskStart, s.startOffset),
    end:   addMin(taskStart, s.startOffset + s.duration),
  }))
}

/** Latest end time of all steps in a task */
function taskSpanEnd(taskStart: Date, steps: Step[]): Date {
  let latest = taskStart
  for (const s of steps) {
    const end = addMin(taskStart, s.startOffset + s.duration)
    if (end > latest) latest = end
  }
  return latest
}

/** True if interval [start, end) overlaps any element in occupied */
function overlapsAny(start: Date, end: Date, occupied: Interval[]): boolean {
  for (const occ of occupied) {
    if (start < occ.end && end > occ.start) return true
  }
  return false
}

/**
 * Check that all steps fit inside [workStart, workEnd) on a weekday,
 * and each step starts & ends on the same day.
 */
function stepsFit(taskStart: Date, steps: Step[], workStart: number, workEnd: number): boolean {
  for (const s of steps) {
    const sDate  = addMin(taskStart, s.startOffset)
    const eDate  = addMin(taskStart, s.startOffset + s.duration)
    if (!isWeekday(sDate)) return false
    if (isoDate(sDate) !== isoDate(eDate)) return false  // must end same day
    const sMin = minOfDay(sDate)
    const eMin = minOfDay(eDate)
    if (sMin < workStart || eMin > workEnd) return false
  }
  return true
}

/** Sum of all step durations for a task */
function totalDuration(steps: Step[]): number {
  return steps.reduce((a, s) => a + s.duration, 0)
}

/** Count intervals < `minGap` minutes in a set of occupied intervals for a given day */
function countTinyGaps(dayISO: string, occupied: Interval[], minGap: number, workStart: number, workEnd: number): number {
  const dayIntervals = occupied
    .filter(iv => isoDate(iv.start) === dayISO)
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  let count = 0
  let cursor = workStart  // minutes

  for (const iv of dayIntervals) {
    const ivStart = minOfDay(iv.start)
    const gap = ivStart - cursor
    if (gap > 0 && gap < minGap) count++
    cursor = Math.max(cursor, minOfDay(iv.end))
  }
  // gap at end of day
  const endGap = workEnd - cursor
  if (endGap > 0 && endGap < minGap) count++
  return count
}

/** Daily busy minutes keyed by ISO date string for Mon–Fri of the given week */
function dailyBusyMap(weekMonday: Date, occupied: Interval[]): Map<string, number> {
  const map = new Map<string, number>()
  for (let i = 0; i < 5; i++) {
    const d = new Date(weekMonday)
    d.setDate(weekMonday.getDate() + i)
    map.set(isoDate(d), 0)
  }
  for (const iv of occupied) {
    const key = isoDate(iv.start)
    if (map.has(key)) {
      const duration = (iv.end.getTime() - iv.start.getTime()) / 60_000
      map.set(key, (map.get(key) ?? 0) + duration)
    }
  }
  return map
}

/** Population std deviation of an array of numbers */
function stdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

// ── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Score a candidate placement. Lower = better.
 *
 * Components:
 *   + dailyLoadFraction * 100          penalise loaded days (0–100)
 *   - deadlineMarginBonus * 50         bonus when comfortable margin before deadline
 *   + tinyGapCount * 30                penalise creating sub-30-min gaps
 */
function scoreCandidate(
  candidate:  Date,
  steps:      Step[],
  deadline:   Date | undefined,
  occupied:   Interval[],
  workStart:  number,
  workEnd:    number,
  weekMonday: Date,
): number {
  const dailyBusy = dailyBusyMap(weekMonday, occupied)
  const dayISO    = isoDate(candidate)
  const dayMins   = dailyBusy.get(dayISO) ?? 0
  const workSpan  = workEnd - workStart

  // Daily load fraction (0..1, can exceed 1 if over-packed)
  const loadFraction = workSpan > 0 ? dayMins / workSpan : 0

  // Deadline margin bonus (positive = more margin = better)
  let deadlineBonus = 0
  if (deadline) {
    const taskEnd     = taskSpanEnd(candidate, steps)
    const marginMins  = (deadline.getTime() - taskEnd.getTime()) / 60_000
    deadlineBonus     = Math.min(5, Math.max(-1, marginMins / (24 * 60)))
  }

  // Tiny gap penalty (simulate adding the intervals then count)
  const projected  = [...occupied, ...taskIntervals(candidate, steps)]
  const tinyGaps   = countTinyGaps(dayISO, projected, 30, workStart, workEnd)

  return loadFraction * 100 - deadlineBonus * 50 + tinyGaps * 30
}

// ── Phase 2 helper: find best slot for one task ───────────────────────────────

interface PlacementAttempt {
  candidate: Date
  score:     number
}

function findBestSlot(
  task:       Task,
  startFrom:  Date,
  occupied:   Interval[],
  workStart:  number,
  workEnd:    number,
  weekMonday: Date,
  maxCandidates: number,
): PlacementAttempt | null {
  const candidates: PlacementAttempt[] = []
  let cursor = new Date(startFrom)
  const maxIter = 500 // safety valve

  for (let iter = 0; iter < maxIter && candidates.length < maxCandidates; iter++) {
    // Ensure we're on a weekday at or after workStart
    if (!isWeekday(cursor) || minOfDay(cursor) < workStart) {
      cursor = nextWorkDayStart(cursor, workStart)
    }

    // Check if any step would overflow end-of-day → push to next working day
    const wouldOverflow = task.steps.some(s => {
      const eMin = minOfDay(addMin(cursor, s.startOffset + s.duration))
      return eMin > workEnd
    })
    if (wouldOverflow) {
      cursor = advanceToNextWorkDay(cursor, workStart)
      continue
    }

    // Check steps fit working hours
    if (!stepsFit(cursor, task.steps, workStart, workEnd)) {
      cursor = addMin(cursor, 15)
      if (minOfDay(cursor) >= workEnd) cursor = advanceToNextWorkDay(cursor, workStart)
      continue
    }

    // Check no step overlaps with occupied
    const ivals = taskIntervals(cursor, task.steps)
    const hasOverlap = ivals.some(iv => overlapsAny(iv.start, iv.end, occupied))
    if (hasOverlap) {
      cursor = addMin(cursor, 15)
      if (minOfDay(cursor) >= workEnd) cursor = advanceToNextWorkDay(cursor, workStart)
      continue
    }

    // Valid candidate — score it
    const score = scoreCandidate(cursor, task.steps, task.deadline, occupied, workStart, workEnd, weekMonday)
    candidates.push({ candidate: new Date(cursor), score })

    // Advance by 15 min for next candidate search
    cursor = addMin(cursor, 15)
    if (minOfDay(cursor) >= workEnd) cursor = advanceToNextWorkDay(cursor, workStart)
  }

  if (candidates.length === 0) return null
  return candidates.reduce((best, c) => c.score < best.score ? c : best)
}

// ── Main ─────────────────────────────────────────────────────────────────────

/**
 * @param tasks        All planner tasks (manual + auto)
 * @param weekStart    Any date in the target week (will be normalized to Monday)
 * @param workStartMin Work-day start in minutes (e.g. 8*60 = 480)
 * @param workEndMin   Work-day end in minutes (e.g. 19*60 = 1140)
 */
export function optimizeWeek(
  tasks:        Task[],
  weekStart:    Date,
  workStartMin: number = 8  * 60,
  workEndMin:   number = 19 * 60,
): OptimizeResult {
  const weekMonday = mondayOf(weekStart)

  // ── Phase 1: Preprocessing ─────────────────────────────────────────────────

  const manualTasks = tasks.filter(t => t.placement === 'manual')
  const autoTasks   = tasks.filter(t => t.placement === 'auto')

  // Pre-fill occupied timeline from manual tasks
  const occupied: Interval[] = []
  for (const t of manualTasks) {
    if (t.scheduledStart) {
      occupied.push(...taskIntervals(t.scheduledStart, t.steps))
    }
  }

  // Sort auto tasks: deadline ASC (tasks with deadlines first), then longest duration first
  const sorted = [...autoTasks].sort((a, b) => {
    if (a.deadline && b.deadline) return a.deadline.getTime() - b.deadline.getTime()
    if (a.deadline)  return -1
    if (b.deadline)  return  1
    return totalDuration(b.steps) - totalDuration(a.steps)
  })

  // Build results list — manual tasks pass through unchanged
  const results: ScheduledTaskResult[] = manualTasks.map(t => ({
    id:             t.id,
    scheduledStart: t.scheduledStart ?? nextWorkDayStart(weekMonday, workStartMin),
    conflict:       false,
  }))

  // ── Phase 2: Greedy placement ───────────────────────────────────────────────

  const autoResults: ScheduledTaskResult[] = []
  const startFrom = nextWorkDayStart(weekMonday, workStartMin)

  for (const task of sorted) {
    if (task.steps.length === 0) {
      autoResults.push({ id: task.id, scheduledStart: startFrom, conflict: false })
      continue
    }

    const best = findBestSlot(task, startFrom, occupied, workStartMin, workEndMin, weekMonday, 5)

    if (!best) {
      autoResults.push({
        id:             task.id,
        scheduledStart: startFrom,
        conflict:       true,
        conflictReason: 'No available slot this week',
      })
      continue
    }

    // Check deadline miss
    const taskEnd = taskSpanEnd(best.candidate, task.steps)
    const missedDeadline = task.deadline ? taskEnd > task.deadline : false

    autoResults.push({
      id:             task.id,
      scheduledStart: best.candidate,
      conflict:       missedDeadline,
      conflictReason: missedDeadline
        ? `Ends after deadline (${task.deadline!.toLocaleDateString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })})`
        : undefined,
    })

    // Add intervals to occupied
    occupied.push(...taskIntervals(best.candidate, task.steps))
  }

  // ── Phase 3: Balance pass ───────────────────────────────────────────────────
  // If stdDev of daily busy minutes across Mon-Fri > 60 min, try to move
  // tasks without deadlines to lighter days.

  const busyMap = dailyBusyMap(weekMonday, occupied)
  const dailyValues = [...busyMap.values()]

  if (stdDev(dailyValues) > 60) {
    const resultMap = new Map(autoResults.map(r => [r.id, r]))
    const taskMap   = new Map(sorted.map(t => [t.id, t]))

    const moveable = autoResults.filter(r => {
      const t = taskMap.get(r.id)
      return t && !t.deadline && !r.conflict
    })

    for (const entry of moveable) {
      const task = taskMap.get(entry.id)!

      for (let attempt = 0; attempt < 3; attempt++) {
        // Find the lightest day
        const lightestEntry = [...busyMap.entries()].reduce(
          (min, cur) => cur[1] < min[1] ? cur : min
        )
        const lightestISO = lightestEntry[0]
        const lightestDate = new Date(lightestISO + 'T00:00:00')

        // Remove the task's current intervals from occupied
        const currentStart  = entry.scheduledStart
        const currentIvals  = taskIntervals(currentStart, task.steps)
        const occupiedCopy  = occupied.filter(iv =>
          !currentIvals.some(ci => ci.start.getTime() === iv.start.getTime() && ci.end.getTime() === iv.end.getTime())
        )

        const dayStart = new Date(lightestDate)
        dayStart.setHours(Math.floor(workStartMin / 60), workStartMin % 60, 0, 0)

        const newBest = findBestSlot(task, dayStart, occupiedCopy, workStartMin, workEndMin, weekMonday, 1)
        if (!newBest) continue

        // Check if moving reduces imbalance
        const projOccupied = [...occupiedCopy, ...taskIntervals(newBest.candidate, task.steps)]
        const newBusyMap   = dailyBusyMap(weekMonday, projOccupied)
        if (stdDev([...newBusyMap.values()]) < stdDev(dailyValues)) {
          // Accept the move
          entry.scheduledStart = newBest.candidate
          resultMap.set(task.id, entry)

          // Update occupied
          for (const ci of currentIvals) {
            const idx = occupied.findIndex(iv => iv.start.getTime() === ci.start.getTime() && iv.end.getTime() === ci.end.getTime())
            if (idx !== -1) occupied.splice(idx, 1)
          }
          occupied.push(...taskIntervals(newBest.candidate, task.steps))

          // Update busyMap
          const updatedMap = dailyBusyMap(weekMonday, occupied)
          for (const [k, v] of updatedMap) busyMap.set(k, v)
          break
        }
      }
    }
  }

  const allResults = [...results, ...autoResults]
  const scheduled  = autoResults.filter(r => !r.conflict).length
  const conflicts  = autoResults.filter(r => r.conflict).length

  return { results: allResults, scheduled, conflicts }
}
