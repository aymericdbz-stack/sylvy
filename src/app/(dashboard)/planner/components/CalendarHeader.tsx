'use client'

import { ChevronLeft, ChevronRight, Download, BookTemplate } from 'lucide-react'
import Button from '@/components/ui/pl/Button'
import type { CalendarView, CalendarEvent } from '../types'

// ── Locale helpers ────────────────────────────────────────────────────────────
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_FULL  = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function weekLabel(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const sDay = monday.getDate()
  const sMon = MONTHS_SHORT[monday.getMonth()]
  const eDay = sunday.getDate()
  const eMon = MONTHS_SHORT[sunday.getMonth()]
  const year = sunday.getFullYear()

  if (monday.getMonth() === sunday.getMonth()) {
    return `${sDay} – ${eDay} ${eMon} ${year}`
  }
  return `${sDay} ${sMon} – ${eDay} ${eMon} ${year}`
}

function monthLabel(d: Date): string {
  return `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface CalendarHeaderProps {
  view:             CalendarView
  currentDate:      Date
  events:           CalendarEvent[]
  onViewChange:     (v: CalendarView) => void
  onPrev:           () => void
  onNext:           () => void
  onToday:          () => void
  onSyncOpen:       () => void
  onTemplatesOpen:  () => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CalendarHeader({
  view, currentDate,
  onViewChange, onPrev, onNext, onToday, onSyncOpen, onTemplatesOpen,
}: CalendarHeaderProps) {
  const label = view === 'week' ? weekLabel(currentDate) : monthLabel(currentDate)

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-pl-cream-border flex-shrink-0 bg-pl-cream">

      {/* Left: title + navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="p-1 rounded-[5px] text-pl-muted hover:text-pl-charcoal hover:bg-pl-cream-dark transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-[14px] font-[700] text-pl-charcoal font-nb-mono min-w-[180px] text-center select-none">
          {label}
        </span>

        <button
          onClick={onNext}
          className="p-1 rounded-[5px] text-pl-muted hover:text-pl-charcoal hover:bg-pl-cream-dark transition-colors"
        >
          <ChevronRight size={16} />
        </button>

        <Button variant="ghost" size="sm" onClick={onToday}>
          Today
        </Button>
      </div>

      {/* Right: view toggle + actions */}
      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex bg-pl-cream-dark rounded-[6px] p-0.5 border border-pl-cream-border">
          {(['week', 'month'] as CalendarView[]).map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1 rounded-[4px] text-[11px] font-[600] font-nb-mono transition-colors ${
                view === v
                  ? 'bg-white text-pl-charcoal shadow-sm border border-pl-cream-border'
                  : 'text-pl-muted hover:text-pl-charcoal'
              }`}
            >
              {v === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>

        {/* Templates */}
        <button
          onClick={onTemplatesOpen}
          className="p-1.5 rounded-[5px] text-pl-muted hover:text-pl-charcoal hover:bg-pl-cream-dark transition-colors"
          title="Task templates"
        >
          <BookTemplate size={15} />
        </button>

        {/* Export / sync */}
        <button
          onClick={onSyncOpen}
          className="p-1.5 rounded-[5px] text-pl-muted hover:text-pl-charcoal hover:bg-pl-cream-dark transition-colors"
          title="Export / Sync"
        >
          <Download size={15} />
        </button>
      </div>

    </div>
  )
}
