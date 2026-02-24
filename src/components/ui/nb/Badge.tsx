import { cn } from '@/lib/utils'

type BadgeVariant = 'green' | 'gray' | 'red' | 'warning'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-nb-green-light text-nb-green',
  gray: 'bg-nb-cream-dark text-nb-muted',
  red: 'bg-red-50 text-nb-error',
  warning: 'bg-orange-50 text-nb-warning',
}

export default function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center text-[10px] font-[600] uppercase tracking-[0.06em] px-2 py-0.5 rounded-[4px] font-nb-mono',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  )
}
