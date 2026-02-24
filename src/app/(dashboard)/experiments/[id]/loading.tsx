import { Skeleton, SkeletonCard } from '@/components/ui/nb/Skeleton'

export default function ExperimentLoading() {
  return (
    <div>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-7 w-64 mb-1" />
      <Skeleton className="h-3 w-40 mb-8" />
      <SkeletonCard className="mb-6" />
      <Skeleton className="h-5 w-24 mb-4" />
      <SkeletonCard className="mb-6" />
      <SkeletonCard />
    </div>
  )
}
