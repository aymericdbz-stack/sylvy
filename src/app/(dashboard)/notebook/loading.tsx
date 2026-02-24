import { Skeleton, SkeletonCard } from '@/components/ui/nb/Skeleton'

export default function NotebookLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-7 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-6 mb-8">
          <div className="w-[72px] shrink-0 pt-3 text-right">
            <Skeleton className="h-4 w-12 ml-auto" />
          </div>
          <div className="flex-1">
            <SkeletonCard className="mb-2" />
            <SkeletonCard className="mb-2" />
          </div>
        </div>
      ))}
    </div>
  )
}
