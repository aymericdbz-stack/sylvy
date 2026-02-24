import { Skeleton, SkeletonCard } from '@/components/ui/nb/Skeleton'

export default function SettingsLoading() {
  return (
    <div>
      <Skeleton className="h-7 w-24 mb-8" />
      <SkeletonCard className="mb-8" />
      <div className="border-t border-nb-cream-border mb-8" />
      <SkeletonCard />
    </div>
  )
}
