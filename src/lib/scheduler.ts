// ── Planner scheduler — pure TS, zero UI deps ──────────────────────────────

export type Step = {
  id: string
  name: string
  duration: number      // minutes
  startOffset: number   // minutes from task start (T+)
}

export type Task = {
  id: string
  name: string
  steps: Step[]
  deadline?: Date
  color: string
}

export type ScheduledTask = Task & {
  scheduledStart: Date
  conflict: boolean
  conflictReason?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const WORK_START = 8 * 60   // 08:00 in minutes
const WORK_END   = 19 * 60  // 19:00 in minutes

/** Advance date to the next working day 08:00 if on a weekend */
function nextWorkingDay08(d: Date): Date {
  const r = new Date(d)
  r.setHours(8, 0, 0, 0)
  const dow = r.getDay()
  if (dow === 0) r.setDate(r.getDate() + 1) // Sun → Mon
  if (dow === 6) r.setDate(r.getDate() + 2) // Sat → Mon
  return r
}

/** Minutes since midnight */
function minuteOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

/** Add minutes, return new Date */
function addMin(d: Date, min: number): Date {
  return new Date(d.getTime() + min * 60_000)
}

/** True if d is Mon-Fri */
function isWeekday(d: Date): boolean {
  const dow = d.getDay()
  return dow >= 1 && dow <= 5
}

/**
 * For a task starting at `taskStart`, return the absolute time intervals that
 * are "active work" (blocking the timeline).
 * Each step occupies [taskStart + step.startOffset, taskStart + step.startOffset + step.duration)
 */
function getActiveIntervals(taskStart: Date, steps: Step[]): { start: Date; end: Date }[] {
  return steps.map(s => ({
    start: addMin(taskStart, s.startOffset),
    end:   addMin(taskStart, s.startOffset + s.duration),
  }))
}

/** Latest absolute end time for any step in a task starting at `taskStart` */
function taskEndTime(taskStart: Date, steps: Step[]): Date {
  let latest = taskStart
  for (const s of steps) {
    const end = addMin(taskStart, s.startOffset + s.duration)
    if (end > latest) latest = end
  }
  return latest
}

/** Check if a time interval [start, end) overlaps with any occupied intervals */
function overlaps(start: Date, end: Date, occupied: { start: Date; end: Date }[]): boolean {
  for (const occ of occupied) {
    if (start < occ.end && end > occ.start) return true
  }
  return false
}

/** Check that all active intervals for a task fit within working hours and weekdays */
function fitsWorkingHours(taskStart: Date, steps: Step[]): boolean {
  const intervals = getActiveIntervals(taskStart, steps)
  for (const iv of intervals) {
    // Check start day
    if (!isWeekday(iv.start) || !isWeekday(iv.end)) return false
    // Same-day check: both start and end must be within [08:00, 19:00]
    const sMin = minuteOfDay(iv.start)
    const eMin = minuteOfDay(iv.end)
    if (sMin < WORK_START || eMin > WORK_END) return false
    // Multi-day step: a step can span multiple days via T+ offset
    // For simplicity, we require each step to start and end on the same working day
    if (iv.start.toDateString() !== iv.end.toDateString()) return false
  }
  return true
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function optimizeWeek(tasks: Task[], weekStart: Date): ScheduledTask[] {
  // Sort: earliest deadline first, no deadline last
  const sorted = [...tasks].sort((a, b) => {
    if (a.deadline && b.deadline) return a.deadline.getTime() - b.deadline.getTime()
    if (a.deadline) return -1
    if (b.deadline) return 1
    return 0
  })

  // Global list of occupied (active-work) intervals across all scheduled tasks
  const occupied: { start: Date; end: Date }[] = []

  const result: ScheduledTask[] = []

  for (const task of sorted) {
    if (task.steps.length === 0) {
      result.push({ ...task, scheduledStart: weekStart, conflict: false })
      continue
    }

    // Try to find the earliest slot starting from weekStart 08:00
    let candidate = nextWorkingDay08(weekStart)
    let placed = false
    const maxAttempts = 60 // max ~12 working weeks out

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Ensure candidate is 08:00 of a working day
      if (!isWeekday(candidate) || minuteOfDay(candidate) < WORK_START) {
        candidate = nextWorkingDay08(candidate)
      }

      // Check if all active intervals fit within working hours
      if (!fitsWorkingHours(candidate, task.steps)) {
        // Move to next working day
        candidate = nextWorkingDay08(addMin(candidate, 24 * 60))
        continue
      }

      // Check if any active interval overlaps with already-occupied intervals
      const intervals = getActiveIntervals(candidate, task.steps)
      const hasOverlap = intervals.some(iv => overlaps(iv.start, iv.end, occupied))

      if (!hasOverlap) {
        // Place the task here
        occupied.push(...intervals)
        const conflict = task.deadline ? taskEndTime(candidate, task.steps) > task.deadline : false
        result.push({
          ...task,
          scheduledStart: candidate,
          conflict,
          conflictReason: conflict
            ? `Fin prévue après la deadline (${task.deadline!.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })})`
            : undefined,
        })
        placed = true
        break
      }

      // Advance candidate by 15 minutes and try again
      candidate = addMin(candidate, 15)
      // If we went past work end, jump to next day
      if (minuteOfDay(candidate) >= WORK_END) {
        candidate = nextWorkingDay08(addMin(candidate, 24 * 60))
      }
    }

    if (!placed) {
      result.push({
        ...task,
        scheduledStart: nextWorkingDay08(weekStart),
        conflict: true,
        conflictReason: 'Impossible de placer cette tâche dans les créneaux disponibles',
      })
    }
  }

  return result
}
