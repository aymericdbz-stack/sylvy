/**
 * Timezone-aware datetime conversion utilities.
 * Uses Intl.DateTimeFormat — no external library needed.
 */

/** Convert a UTC ISO string to a { date, time } pair in the given timezone (for display in inputs). */
export function utcToTzDatetime(utcISO: string, tz: string): { date: string; time: string } {
  const d = new Date(utcISO)
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(d)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00'
  const h = get('hour')
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${h === '24' ? '00' : h}:${get('minute')}`,
  }
}

/**
 * Convert a local date + time entered in the given timezone to a UTC ISO string.
 * Handles DST correctly via the offset-correction trick.
 */
export function tzDatetimeToUTC(date: string, time: string, tz: string): string {
  // Treat the input as UTC first, then measure the timezone's offset at that moment
  const tentative = new Date(`${date}T${time}:00Z`)

  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(tentative)
  const get   = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0')

  const tzTime   = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), 0)

  // month - 1 because Date.UTC expects 0-indexed month (0=Jan, 1=Feb, …)
  const [wYear, wMonth, wDay] = date.split('-').map(Number)
  const [wHour, wMin]         = time.split(':').map(Number)
  const wantTime = Date.UTC(wYear, wMonth - 1, wDay, wHour, wMin, 0)

  const offset   = tzTime - wantTime

  return new Date(tentative.getTime() - offset).toISOString()
}
