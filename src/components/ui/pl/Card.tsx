import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight' | 'question'
}

export default function Card({ variant = 'default', className, children, ...props }: CardProps) {
  const variantClasses = {
    default: 'bg-white border-pl-cream-border',
    highlight: 'bg-pl-orange-light border-pl-orange/30',
    question: 'bg-amber-50 border-amber-200',
  }

  return (
    <div
      className={cn(
        'rounded-[8px] border p-4 font-nb-mono',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
