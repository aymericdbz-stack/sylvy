'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

const ITEM_HEIGHT = 44
const VISIBLE = 5 // must be odd
const PADDING = Math.floor(VISIBLE / 2) // 2

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

function parseTiming(timing: string | null | undefined): { h: number; m: number } {
  if (!timing) return { h: 0, m: 0 }
  const hMatch = timing.match(/(\d+)\s*h/)
  const mMatch = timing.match(/(\d+)\s*min/)
  return {
    h: hMatch ? Math.min(23, parseInt(hMatch[1], 10)) : 0,
    m: mMatch ? Math.min(59, parseInt(mMatch[1], 10)) : 0,
  }
}

function formatTiming(h: number, m: number): string {
  if (h === 0 && m === 0) return ''
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

interface ScrollDrumProps {
  items: string[]
  selectedIndex: number
  onSelect: (i: number) => void
  label: string
}

function ScrollDrum({ items, selectedIndex, onSelect, label }: ScrollDrumProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const isUserScrolling = useRef(false)
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync scroll position when selectedIndex changes externally
  useEffect(() => {
    const el = listRef.current
    if (!el || isUserScrolling.current) return
    el.scrollTo({ top: selectedIndex * ITEM_HEIGHT, behavior: 'smooth' })
  }, [selectedIndex])

  // On mount, jump instantly without animation
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = selectedIndex * ITEM_HEIGHT
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleScroll = useCallback(() => {
    isUserScrolling.current = true
    if (snapTimer.current) clearTimeout(snapTimer.current)
    snapTimer.current = setTimeout(() => {
      const el = listRef.current
      if (!el) return
      const idx = Math.round(el.scrollTop / ITEM_HEIGHT)
      const clamped = Math.max(0, Math.min(items.length - 1, idx))
      isUserScrolling.current = false
      onSelect(clamped)
      el.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: 'smooth' })
    }, 120)
  }, [items.length, onSelect])

  return (
    <div className="relative flex flex-col items-center" style={{ width: 72 }}>
      {/* Selection highlight strip */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-10 rounded-[8px] bg-nb-cream border border-nb-cream-border"
        style={{ top: PADDING * ITEM_HEIGHT, height: ITEM_HEIGHT }}
      />

      <ul
        ref={listRef}
        onScroll={handleScroll}
        className="overflow-y-scroll overscroll-contain"
        style={{
          height: VISIBLE * ITEM_HEIGHT,
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Top padding */}
        {Array.from({ length: PADDING }).map((_, i) => (
          <li key={`top-${i}`} aria-hidden style={{ height: ITEM_HEIGHT, flexShrink: 0 }} />
        ))}

        {items.map((item, i) => (
          <li
            key={i}
            style={{ height: ITEM_HEIGHT, scrollSnapAlign: 'center' }}
            className={cn(
              'flex items-center justify-center cursor-pointer select-none transition-all duration-100',
              i === selectedIndex
                ? 'text-[20px] font-[700] text-nb-charcoal relative z-20'
                : 'text-[17px] font-[400] text-nb-muted'
            )}
            onClick={() => {
              onSelect(i)
              listRef.current?.scrollTo({ top: i * ITEM_HEIGHT, behavior: 'smooth' })
            }}
          >
            {item}
          </li>
        ))}

        {/* Bottom padding */}
        {Array.from({ length: PADDING }).map((_, i) => (
          <li key={`bot-${i}`} aria-hidden style={{ height: ITEM_HEIGHT, flexShrink: 0 }} />
        ))}
      </ul>

      <span className="text-[10px] text-nb-muted mt-1.5 font-[600] uppercase tracking-[0.08em]">
        {label}
      </span>
    </div>
  )
}

interface DurationPickerProps {
  value?: string | null
  onChange: (v: string) => void
}

export default function DurationPicker({ value, onChange }: DurationPickerProps) {
  const { h: initH, m: initM } = parseTiming(value)
  const [hours, setHours] = useState(initH)
  const [minutes, setMinutes] = useState(initM)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync if value changes externally (e.g. form reset)
  useEffect(() => {
    const { h, m } = parseTiming(value)
    setHours(h)
    setMinutes(m)
  }, [value])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleHours = useCallback(
    (i: number) => {
      setHours(i)
      onChange(formatTiming(i, minutes))
    },
    [minutes, onChange]
  )

  const handleMinutes = useCallback(
    (i: number) => {
      setMinutes(i)
      onChange(formatTiming(hours, i))
    },
    [hours, onChange]
  )

  const displayValue = formatTiming(hours, minutes)

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[13px] font-[600] text-nb-charcoal mb-1.5">Duration</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full text-left px-3 py-2.5 rounded-[8px] border text-[13px] font-nb-mono transition-colors',
          open ? 'border-nb-green ring-1 ring-nb-green/20' : 'border-nb-cream-border',
          displayValue ? 'text-nb-charcoal' : 'text-nb-muted'
        )}
      >
        {displayValue || 'e.g. 2h 30min'}
      </button>

      {open && (
        <div className="absolute z-30 mt-2 bg-white border border-nb-cream-border rounded-[14px] shadow-xl p-4 left-0">
          <div className="flex items-center gap-3">
            <ScrollDrum items={HOURS} selectedIndex={hours} onSelect={handleHours} label="hours" />
            <span
              className="text-[26px] font-[700] text-nb-charcoal"
              style={{ paddingBottom: 20 }}
            >
              :
            </span>
            <ScrollDrum
              items={MINUTES}
              selectedIndex={minutes}
              onSelect={handleMinutes}
              label="min"
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full py-2 rounded-[8px] bg-nb-green text-white text-[13px] font-[600] hover:bg-nb-green/90 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
