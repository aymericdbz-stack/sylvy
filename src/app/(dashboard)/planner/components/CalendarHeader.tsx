'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Download, BookTemplate, Sparkles, Loader2, Clock } from 'lucide-react'
import Button from '@/components/ui/pl/Button'
import { getWorkHours, setWorkHours } from '@/lib/preferences'
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

// ── Work hours picker ─────────────────────────────────────────────────────────
function fmt(h: number) {
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:00 ${period}`
}

function WorkHoursPicker() {
  const [open,  setOpen]  = useState(false)
  const [start, setStart] = useState(() => getWorkHours().start)
  const [end,   setEnd]   = useState(() => getWorkHours().end)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleStart(h: number) {
    const s = h
    const e = Math.max(h + 1, end)
    setStart(s); setEnd(e)
    setWorkHours(s, e)
  }
  function handleEnd(h: number) {
    const e = h
    const s = Math.min(start, h - 1)
    setStart(s); setEnd(e)
    setWorkHours(s, e)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[11px] font-[600] font-nb-mono text-pl-muted hover:text-pl-charcoal hover:bg-pl-cream-dark transition-colors border border-transparent hover:border-pl-cream-border"
        title="Working hours"
      >
        <Clock size={13} />
        {fmt(start)}–{fmt(end)}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-pl-cream-border rounded-[8px] shadow-xl p-3 w-[200px]">
          <p className="text-[10px] font-[700] text-pl-muted font-nb-mono uppercase tracking-[0.06em] mb-2.5">Working hours</p>
          <div className="space-y-2">
            {([['From', start, handleStart], ['To', end, handleEnd]] as const).map(([label, val, handler]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-pl-muted font-nb-mono w-8">{label}</span>
                <select
                  value={val}
                  onChange={e => handler(parseInt(e.target.value))}
                  className="flex-1 bg-pl-cream border border-pl-cream-border rounded-[5px] px-2 py-1 text-[11px] font-nb-mono text-pl-charcoal focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{fmt(i)}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-pl-muted-light font-nb-mono mt-2.5">
            Saved automatically · affects next optimization
          </p>
        </div>
      )}
    </div>
  )
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
  onOptimize?:      () => void
  isOptimizing?:    boolean
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CalendarHeader({
  view, currentDate,
  onViewChange, onPrev, onNext, onToday, onSyncOpen, onTemplatesOpen,
  onOptimize, isOptimizing = false,
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

        {/* Optimize */}
        {onOptimize && (
          <button
            onClick={onOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-[600] font-nb-mono bg-pl-orange text-white hover:bg-pl-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Re-optimize all auto tasks this week"
          >
            {isOptimizing
              ? <Loader2 size={13} className="animate-spin" />
              : <Sparkles size={13} />
            }
            Optimize
          </button>
        )}

        {/* Work hours */}
        <WorkHoursPicker />

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
