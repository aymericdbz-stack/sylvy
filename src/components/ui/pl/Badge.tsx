import { cn } from '@/lib/utils'

type Color = 'orange' | 'gray' | 'green' | 'red' | 'amber'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: Color
}

const colorClasses: Record<Color, string> = {
  orange: 'bg-pl-orange-light text-pl-orange-dark border-pl-orange/25',
  gray:   'bg-pl-cream-dark text-pl-muted border-pl-cream-border',
  green:  'bg-green-50 text-green-700 border-green-200',
  red:    'bg-red-50 text-red-700 border-red-200',
  amber:  'bg-amber-50 text-amber-700 border-amber-200',
}

export default function Badge({ color = 'gray', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[10px] font-[600] font-nb-mono uppercase tracking-[0.05em]',
        colorClasses[color],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
