'use client'

import { useRef, useEffect } from 'react'
import { Download, Calendar, ExternalLink, X } from 'lucide-react'
import type { CalendarEvent } from '../types'
import { downloadIcal } from '../utils/ical'

interface SyncMenuProps {
  events:          CalendarEvent[]
  weekEvents:      CalendarEvent[]   // events in current view
  open:            boolean
  onClose:         () => void
}

export default function SyncMenu({ events, weekEvents, open, onClose }: SyncMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open, onClose])

  if (!open) return null

  function exportWeek() {
    downloadIcal(weekEvents, 'sylvy-semaine.ics')
    onClose()
  }

  function exportAll() {
    downloadIcal(events, 'sylvy-calendrier.ics')
    onClose()
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-50 w-[260px] bg-pl-surface rounded-[10px] border border-pl-cream-border shadow-xl font-nb-mono overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-pl-cream-border">
        <span className="text-[12px] font-[700] text-pl-charcoal">Exporter / Synchroniser</span>
        <button onClick={onClose} className="text-pl-muted hover:text-pl-charcoal">
          <X size={14} />
        </button>
      </div>

      {/* iCal section */}
      <div className="p-2">
        <p className="px-2 py-1 text-[10px] font-[600] uppercase tracking-[0.06em] text-pl-muted">
          Apple Calendar · Outlook · iCal
        </p>
        <button
          onClick={exportWeek}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-[12px] text-pl-charcoal hover:bg-pl-cream-dark transition-colors text-left"
        >
          <Download size={13} className="text-pl-orange flex-shrink-0" />
          <div>
            <div className="font-[600]">Exporter la semaine (.ics)</div>
            <div className="text-[10px] text-pl-muted">{weekEvents.length} événement{weekEvents.length > 1 ? 's' : ''}</div>
          </div>
        </button>
        <button
          onClick={exportAll}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-[12px] text-pl-charcoal hover:bg-pl-cream-dark transition-colors text-left"
        >
          <Download size={13} className="text-pl-muted-light flex-shrink-0" />
          <div>
            <div className="font-[600]">Exporter tout (.ics)</div>
            <div className="text-[10px] text-pl-muted">{events.length} événement{events.length > 1 ? 's' : ''} au total</div>
          </div>
        </button>
      </div>

      <div className="border-t border-pl-cream-border" />

      {/* Google Calendar section */}
      <div className="p-2">
        <p className="px-2 py-1 text-[10px] font-[600] uppercase tracking-[0.06em] text-pl-muted">
          Google Calendar
        </p>
        <a
          href="https://support.google.com/calendar/answer/37118"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-[12px] text-pl-charcoal hover:bg-pl-cream-dark transition-colors"
        >
          <ExternalLink size={13} className="text-blue-500 flex-shrink-0" />
          <div>
            <div className="font-[600]">Importer dans Google Calendar</div>
            <div className="text-[10px] text-pl-muted">Utilise le fichier .ics exporté</div>
          </div>
        </a>
      </div>

      {/* Info footer */}
      <div className="px-4 py-3 border-t border-pl-cream-border">
        <div className="flex items-start gap-2">
          <Calendar size={11} className="text-pl-muted flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-pl-muted leading-relaxed">
            Pour un abonnement en direct, ouvre le fichier .ics importé puis choisis{' '}
            <span className="text-pl-charcoal font-[600]">« S&apos;abonner »</span> dans Apple Calendar.
          </p>
        </div>
      </div>
    </div>
  )
}
