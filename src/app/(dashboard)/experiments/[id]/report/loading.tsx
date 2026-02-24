import { Skeleton } from '@/components/ui/nb/Skeleton'

export default function ReportLoading() {
  return (
    <div>
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-7 w-64 mb-1" />
      <Skeleton className="h-3 w-40 mb-6" />
      <Skeleton className="h-2 w-full mb-8" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-nb-cream-border rounded-[8px] p-4 mb-4">
          <Skeleton className="h-3 w-16 mb-3" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  )
}
