'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-nb-green text-white border-transparent hover:bg-nb-green-dark active:scale-[0.98]',
  secondary:
    'bg-white text-nb-charcoal border-nb-cream-border hover:bg-nb-cream-dark active:scale-[0.98]',
  ghost:
    'bg-transparent text-nb-muted border-transparent hover:text-nb-charcoal hover:bg-nb-cream active:scale-[0.98]',
  danger:
    'bg-nb-error text-white border-transparent hover:opacity-90 active:scale-[0.98]',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[11px]',
  md: 'px-4 py-2 text-[13px]',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-[6px] border font-[600] transition-all duration-150 cursor-pointer font-nb-mono',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </span>
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'NbButton'

export default Button
