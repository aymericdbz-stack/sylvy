import type { CalendarEvent } from '../types'

// RFC 5545 date formatting
function fmtDate(d: Date): string {
  return d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
}

// RFC 5545 line folding (max 75 octets per line)
function fold(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  let i = 0
  chunks.push(line.slice(0, 75))
  i = 75
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74))
    i += 74
  }
  return chunks.join('\r\n')
}

function escIcal(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function generateIcal(events: CalendarEvent[], calName = 'Sylvy Lab Calendar'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sylvy//Sylvy Lab Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escIcal(calName)}`,
  ]

  const stamp = fmtDate(new Date())

  for (const event of events) {
    const start = new Date(event.start_at)
    const end   = new Date(event.end_at)

    lines.push('BEGIN:VEVENT')
    lines.push(fold(`UID:${event.id}@sylvy.app`))
    lines.push(`DTSTAMP:${stamp}`)

    if (event.all_day) {
      const d = event.start_at.slice(0, 10).replace(/-/g, '')
      lines.push(`DTSTART;VALUE=DATE:${d}`)
      lines.push(`DTEND;VALUE=DATE:${d}`)
    } else {
      lines.push(`DTSTART:${fmtDate(start)}`)
      lines.push(`DTEND:${fmtDate(end)}`)
    }

    lines.push(fold(`SUMMARY:${escIcal(event.title)}`))
    if (event.description) lines.push(fold(`DESCRIPTION:${escIcal(event.description)}`))
    if (event.location)    lines.push(fold(`LOCATION:${escIcal(event.location)}`))
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcal(events: CalendarEvent[], filename = 'sylvy-calendar.ics') {
  const content = generateIcal(events)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const fmt = (d: Date) => fmtDate(d)
  const start = new Date(event.start_at)
  const end   = new Date(event.end_at)
  const params = new URLSearchParams({
    text:  event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    ...(event.description ? { details: event.description } : {}),
    ...(event.location    ? { location: event.location }  : {}),
  })
  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`
}
