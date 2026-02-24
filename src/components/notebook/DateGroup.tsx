import { formatDateShort } from '@/lib/utils'
import ExperimentEntry from './ExperimentEntry'
import type { ExperimentWithMeta } from '@/lib/queries/experiments'

interface DateGroupProps {
  date: string // ISO date string
  experiments: ExperimentWithMeta[]
}

export default function DateGroup({ date, experiments }: DateGroupProps) {
  return (
    <div className="flex gap-6 mb-8">
      {/* Date label */}
      <div className="w-[72px] shrink-0 pt-3 text-right">
        <span className="text-[13px] font-[600] text-nb-green sticky top-8">
          {formatDateShort(date)}
        </span>
      </div>

      {/* Experiments */}
      <div className="flex-1 min-w-0">
        {experiments.map((exp) => (
          <ExperimentEntry key={exp.id} experiment={exp} />
        ))}
      </div>
    </div>
  )
}
