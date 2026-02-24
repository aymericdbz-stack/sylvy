'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  label?: string
  hint?: string
  errorMessage?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, hint, errorMessage, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-[600] text-nb-muted uppercase tracking-[0.04em]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-white border border-nb-cream-border rounded-[6px] px-3 py-2 text-[13px] text-nb-charcoal font-nb-mono',
            'placeholder:text-nb-muted-light placeholder:font-[400]',
            'focus:outline-none focus:border-nb-green transition-colors duration-150',
            error && 'border-nb-error',
            className
          )}
          {...props}
        />
        {errorMessage && <span className="text-[11px] text-nb-error">{errorMessage}</span>}
        {hint && !errorMessage && <span className="text-[11px] text-nb-muted-light">{hint}</span>}
      </div>
    )
  }
)
Input.displayName = 'NbInput'

export default Input
