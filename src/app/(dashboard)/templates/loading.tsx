import { Skeleton } from '@/components/ui/nb/Skeleton'

export default function TemplatesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="bg-white border border-nb-cream-border rounded-[8px] overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-nb-cream-border last:border-0">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
