'use client'

import { ChevronLeft, ChevronRight, Sparkles, Download } from 'lucide-react'
import Button from '@/components/ui/pl/Button'
import type { CalendarView, CalendarEvent } from '../types'

// ── French locale helpers ─────────────────────────────────────────────────────
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

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
  return `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface CalendarHeaderProps {
  view:          CalendarView
  currentDate:   Date    // for week view: the Monday; for month view: any day in the month
  events:        CalendarEvent[]
  aiOpen:        boolean
  onViewChange:  (v: CalendarView) => void
  onPrev:        () => void
  onNext:        () => void
  onToday:       () => void
  onAiToggle:    () => void
  onSyncOpen:    () => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CalendarHeader({
  view, currentDate, aiOpen,
  onViewChange, onPrev, onNext, onToday, onAiToggle, onSyncOpen,
}: CalendarHeaderProps) {
  const label = view === 'week' ? weekLabel(currentDate) : monthLabel(currentDate)

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-pl-cream-border flex-shrink-0 bg-pl-cream">

      {/* Left: title + navigation */}
      <div className="flex items-center gap-3">
        {/* Nav arrows */}
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
          Aujourd&apos;hui
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
              {v === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>

        {/* Export / sync */}
        <button
          onClick={onSyncOpen}
          className="p-1.5 rounded-[5px] text-pl-muted hover:text-pl-charcoal hover:bg-pl-cream-dark transition-colors"
          title="Exporter / Synchroniser"
        >
          <Download size={15} />
        </button>

        {/* AI assistant */}
        <button
          onClick={onAiToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-[600] font-nb-mono transition-colors ${
            aiOpen
              ? 'bg-pl-orange text-white'
              : 'bg-pl-orange/10 text-pl-orange hover:bg-pl-orange/20'
          }`}
          title="Assistant IA"
        >
          <Sparkles size={12} />
          IA
        </button>
      </div>

    </div>
  )
}
