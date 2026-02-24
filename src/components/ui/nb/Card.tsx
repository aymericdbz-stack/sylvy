import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  onClick?: () => void
}

export default function Card({ children, className, hoverable, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-nb-cream-border rounded-[8px] p-5',
        hoverable && 'cursor-pointer hover:border-nb-green transition-colors duration-150',
        className
      )}
    >
      {children}
    </div>
  )
}
