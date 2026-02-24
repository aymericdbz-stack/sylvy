import { Skeleton } from '@/components/ui/nb/Skeleton'

export default function ResourcesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="flex justify-end mb-4">
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="bg-white border border-nb-cream-border rounded-[8px] overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-nb-cream-border last:border-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
