'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: boolean
  errorMessage?: string
  disabled?: boolean
  className?: string
}

export default function Select({
  options, value, onChange, placeholder = 'Select...', label,
  error, errorMessage, disabled, className,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectId = label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-[11px] font-[600] text-nb-muted uppercase tracking-[0.04em]">
          {label}
        </label>
      )}
      <div ref={ref} className={cn('relative font-nb-mono', className)}>
        <button
          type="button"
          id={selectId}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'w-full flex items-center justify-between bg-white border border-nb-cream-border rounded-[6px] px-3 py-2 text-[13px] text-left',
            'focus:outline-none focus:border-nb-green transition-colors duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'border-nb-error',
            selected ? 'text-nb-charcoal' : 'text-nb-muted-light'
          )}
        >
          {selected?.label ?? placeholder}
          <ChevronDown size={14} strokeWidth={1.5} className={cn('text-nb-muted transition-transform duration-150', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute z-30 w-full mt-1 bg-white border border-nb-cream-border rounded-[6px] shadow-sm overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={cn(
                  'w-full px-3 py-2 text-[13px] text-left hover:bg-nb-cream cursor-pointer transition-colors duration-150',
                  opt.value === value ? 'text-nb-green font-[600]' : 'text-nb-charcoal'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {errorMessage && <span className="text-[11px] text-nb-error">{errorMessage}</span>}
    </div>
  )
}
