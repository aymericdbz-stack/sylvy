import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse bg-nb-cream-dark rounded-[4px]', className)}
    />
  )
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white border border-nb-cream-border rounded-[8px] p-5', className)}>
      <Skeleton className="h-4 w-1/3 mb-3" />
      <SkeletonText lines={2} />
    </div>
  )
}
