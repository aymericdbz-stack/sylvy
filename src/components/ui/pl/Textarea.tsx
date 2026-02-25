'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[11px] font-[600] text-pl-muted uppercase tracking-[0.06em]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-[6px] border border-pl-cream-border bg-white px-3 py-2.5',
            'text-[13px] font-nb-mono text-pl-charcoal placeholder:text-pl-muted-light',
            'resize-none outline-none transition-all duration-150',
            'focus:border-pl-orange focus:ring-2 focus:ring-pl-orange/15',
            error && 'border-pl-error focus:border-pl-error focus:ring-pl-error/15',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-[11px] text-pl-muted-light">{hint}</p>
        )}
        {error && (
          <p className="text-[11px] text-pl-error">{error}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'PlTextarea'

export default Textarea
