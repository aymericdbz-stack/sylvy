'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  label?: string
  errorMessage?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, label, errorMessage, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[11px] font-[600] text-nb-muted uppercase tracking-[0.04em]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full bg-white border border-nb-cream-border rounded-[6px] px-3 py-2 text-[13px] text-nb-charcoal font-nb-mono',
            'placeholder:text-nb-muted-light placeholder:font-[400]',
            'focus:outline-none focus:border-nb-green',
            'transition-colors duration-150 resize-y min-h-[80px]',
            error && 'border-nb-error',
            className
          )}
          {...props}
        />
        {errorMessage && (
          <span className="text-[11px] text-nb-error">{errorMessage}</span>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export default Textarea
