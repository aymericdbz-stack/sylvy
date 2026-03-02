'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, ExternalLink } from 'lucide-react'
import Button from '@/components/ui/pl/Button'
import type { CalendarEvent, CalendarEventInsert, EventColor } from '../types'
import { googleCalendarUrl } from '../utils/ical'
import { getTimezone } from '@/lib/preferences'
import { utcToTzDatetime, tzDatetimeToUTC } from '../utils/timezone'

// ── Color palette ─────────────────────────────────────────────────────────────
const COLOR_OPTIONS: { value: EventColor; hex: string; label: string }[] = [
  { value: 'orange', hex: '#F97316', label: 'Orange' },
  { value: 'green',  hex: '#4CAF7D', label: 'Green'  },
  { value: 'blue',   hex: '#3B82F6', label: 'Blue'   },
  { value: 'purple', hex: '#8B5CF6', label: 'Purple' },
  { value: 'red',    hex: '#EF4444', label: 'Red'    },
  { value: 'teal',   hex: '#14B8A6', label: 'Teal'   },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function toLocalDateTimeInputs(iso: string): { date: string; time: string } {
  return utcToTzDatetime(iso, getTimezone())
}

function toISO(date: string, time: string): string {
  return tzDatetimeToUTC(date, time, getTimezone())
}

function formatTime12(time24: string): string {
  const [hStr, mStr] = time24.split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  if (Number.isNaN(h) || Number.isNaN(m)) return time24
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')}${period}`
}

function parseTime12(input: string): string | null {
  const trimmed = input.trim()
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 1 || hour > 12 || minute > 59) return null
  const period = match[3].toUpperCase()
  const h24 = (hour % 12) + (period === 'PM' ? 12 : 0)
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface EventModalProps {
  open:             boolean
  event?:           CalendarEvent | null   // null → create
  initialDate?:     string                 // YYYY-MM-DD, pre-fill for new
  initialTime?:     string                 // HH:MM, pre-fill for new
  initialEndTime?:  string                 // HH:MM, from drag-to-create
  onSave:           (data: CalendarEventInsert) => Promise<void>
  onDelete?:        (id: string) => Promise<void>
  onClose:          () => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function EventModal({
  open, event, initialDate, initialTime, initialEndTime, onSave, onDelete, onClose,
}: EventModalProps) {
  const isEdit = !!event && event.source === 'event'

  const defaultDate = initialDate ?? new Date().toISOString().slice(0, 10)
  const defaultTime = initialTime ?? '09:00'
  const defaultEnd  = (() => {
    const [h, m] = defaultTime.split(':').map(Number)
    const end = new Date()
    end.setHours(h + 1, m, 0, 0)
    return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
  })()

  const [title,   setTitle]   = useState('')
  const [sDate,   setSDate]   = useState(defaultDate)
  const [sTime,   setSTime]   = useState(defaultTime)
  const [eDate,   setEDate]   = useState(defaultDate)
  const [eTime,   setETime]   = useState(defaultEnd)
  const [sTimeDisplay, setSTimeDisplay] = useState(formatTime12(defaultTime))
  const [eTimeDisplay, setETimeDisplay] = useState(formatTime12(defaultEnd))
  const [color,   setColor]   = useState<EventColor>('orange')
  const [desc,    setDesc]    = useState('')
  const [loc,     setLoc]     = useState('')
  const [saving,  setSaving]  = useState(false)
  const [deleting,setDeleting]= useState(false)

  // Populate form when editing
  useEffect(() => {
    if (event && event.source === 'event') {
      setTitle(event.title)
      setColor(event.color)
      setDesc(event.description ?? '')
      setLoc(event.location ?? '')
      const s = toLocalDateTimeInputs(event.start_at)
      const e2 = toLocalDateTimeInputs(event.end_at)
      setSDate(s.date); setSTime(s.time)
      setEDate(e2.date); setETime(e2.time)
      setSTimeDisplay(formatTime12(s.time))
      setETimeDisplay(formatTime12(e2.time))
    } else {
      setTitle('')
      setColor('orange')
      setDesc('')
      setLoc('')
      const nextSDate = initialDate ?? new Date().toISOString().slice(0, 10)
      const nextSTime = initialTime ?? '09:00'
      const nextEDate = initialDate ?? new Date().toISOString().slice(0, 10)
      const nextETime = initialEndTime ?? defaultEnd
      setSDate(nextSDate)
      setSTime(nextSTime)
      setEDate(nextEDate)
      setETime(nextETime)
      setSTimeDisplay(formatTime12(nextSTime))
      setETimeDisplay(formatTime12(nextETime))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, open])

  if (!open) return null

  async function handleSave() {
    if (!title.trim()) return
    const parsedStart = parseTime12(sTimeDisplay)
    const parsedEnd = parseTime12(eTimeDisplay)
    if (!parsedStart || !parsedEnd) {
      setSTimeDisplay(formatTime12(sTime))
      setETimeDisplay(formatTime12(eTime))
      return
    }
    setSTime(parsedStart)
    setETime(parsedEnd)
    setSaving(true)
    try {
      await onSave({
        title:       title.trim(),
        description: desc.trim() || null,
        start_at:    toISO(sDate, parsedStart),
        end_at:      toISO(eDate, parsedEnd),
        all_day:     false,
        color,
        location:    loc.trim() || null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!event?.id || !onDelete) return
    setDeleting(true)
    try {
      await onDelete(event.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  // Read-only view for experiment events
  const isReadOnly = !!event && event.source === 'experiment'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="relative bg-pl-surface rounded-[12px] border border-pl-cream-border shadow-xl w-full max-w-[420px] mx-4 font-nb-mono"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-pl-cream-border">
          <h2 className="text-[14px] font-[700] text-pl-charcoal">
            {isReadOnly ? event!.title : isEdit ? 'Edit event' : 'New event'}
          </h2>
          <button onClick={onClose} className="text-pl-muted hover:text-pl-charcoal transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Read-only experiment view */}
        {isReadOnly ? (
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#4CAF7D] flex-shrink-0" />
              <span className="text-[12px] text-pl-muted">Experiment</span>
            </div>
            <div className="text-[12px] text-pl-charcoal">
              <span className="text-pl-muted">Start:</span> {new Date(event!.start_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
            {event!.description && (
              <div className="text-[12px] text-pl-charcoal">
                <span className="text-pl-muted">Project:</span> {event!.description}
              </div>
            )}
            {event!.experiment_id && (
              <a
                href={`/experiments/${event!.experiment_id}`}
                className="inline-flex items-center gap-1.5 text-[11px] text-pl-orange hover:underline mt-1"
              >
                <ExternalLink size={11} />
                Open experiment
              </a>
            )}
            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : (
          /* Edit / create form */
          <div className="px-5 py-4 space-y-4">
            {/* Title */}
            <div>
              <input
                type="text"
                placeholder="Title *"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
                className="w-full bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[13px] text-pl-charcoal placeholder:text-pl-muted-light focus:outline-none focus:ring-1 focus:ring-pl-orange/40 focus:border-pl-orange/60 font-nb-mono"
              />
            </div>

            {/* Date/time row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-pl-muted uppercase tracking-[0.06em]">Start</label>
                <input
                  type="date"
                  value={sDate}
                  onChange={e => { setSDate(e.target.value); if (e.target.value > eDate) setEDate(e.target.value) }}
                  className="w-full bg-white border border-pl-cream-border rounded-[6px] px-2 py-1.5 text-[12px] text-pl-charcoal focus:outline-none focus:ring-1 focus:ring-pl-orange/40 font-nb-mono"
                />
                <input
                  type="text"
                  inputMode="text"
                  placeholder="5:30PM"
                  value={sTimeDisplay}
                  onChange={e => {
                    const next = e.target.value
                    setSTimeDisplay(next)
                    const parsed = parseTime12(next)
                    if (parsed) setSTime(parsed)
                  }}
                  onBlur={() => {
                    const parsed = parseTime12(sTimeDisplay)
                    setSTimeDisplay(parsed ? formatTime12(parsed) : formatTime12(sTime))
                  }}
                  className="w-full bg-white border border-pl-cream-border rounded-[6px] px-2 py-1.5 text-[12px] text-pl-charcoal focus:outline-none focus:ring-1 focus:ring-pl-orange/40 font-nb-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-pl-muted uppercase tracking-[0.06em]">End</label>
                <input
                  type="date"
                  value={eDate}
                  onChange={e => setEDate(e.target.value)}
                  className="w-full bg-white border border-pl-cream-border rounded-[6px] px-2 py-1.5 text-[12px] text-pl-charcoal focus:outline-none focus:ring-1 focus:ring-pl-orange/40 font-nb-mono"
                />
                <input
                  type="text"
                  inputMode="text"
                  placeholder="6:30PM"
                  value={eTimeDisplay}
                  onChange={e => {
                    const next = e.target.value
                    setETimeDisplay(next)
                    const parsed = parseTime12(next)
                    if (parsed) setETime(parsed)
                  }}
                  onBlur={() => {
                    const parsed = parseTime12(eTimeDisplay)
                    setETimeDisplay(parsed ? formatTime12(parsed) : formatTime12(eTime))
                  }}
                  className="w-full bg-white border border-pl-cream-border rounded-[6px] px-2 py-1.5 text-[12px] text-pl-charcoal focus:outline-none focus:ring-1 focus:ring-pl-orange/40 font-nb-mono"
                />
              </div>
            </div>

            {/* Color picker */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-pl-muted uppercase tracking-[0.06em]">Color</label>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.value}
                    title={c.label}
                    onClick={() => setColor(c.value)}
                    className={`w-5 h-5 rounded-full flex-shrink-0 transition-transform ${color === c.value ? 'ring-2 ring-offset-1 ring-pl-charcoal/40 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <textarea
                placeholder="Description (optional)"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={2}
                className="w-full resize-none bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal placeholder:text-pl-muted-light focus:outline-none focus:ring-1 focus:ring-pl-orange/40 font-nb-mono"
              />
            </div>

            {/* Location */}
            <div>
              <input
                type="text"
                placeholder="Location (optional)"
                value={loc}
                onChange={e => setLoc(e.target.value)}
                className="w-full bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal placeholder:text-pl-muted-light focus:outline-none focus:ring-1 focus:ring-pl-orange/40 font-nb-mono"
              />
            </div>

            {/* Google Calendar link (edit mode) */}
            {isEdit && event && (
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-pl-orange hover:underline"
              >
                <ExternalLink size={11} />
                Open in Google Calendar
              </a>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <div>
                {isEdit && onDelete && (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deleting}
                    onClick={handleDelete}
                  >
                    <Trash2 size={12} />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={saving}
                  disabled={!title.trim()}
                  onClick={handleSave}
                >
                  {isEdit ? 'Save' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
