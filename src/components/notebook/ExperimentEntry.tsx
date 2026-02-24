'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Pencil, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTimeAgo } from '@/lib/utils'
import Badge from '@/components/ui/nb/Badge'
import Button from '@/components/ui/nb/Button'
import type { ExperimentWithMeta } from '@/lib/queries/experiments'

interface ReportBlock {
  id: string
  type: string
  content: string | null
  order: number
}

interface ExperimentEntryProps {
  experiment: ExperimentWithMeta & {
    heading_blocks?: ReportBlock[]
    file_count?: number
  }
}

export default function ExperimentEntry({ experiment }: ExperimentEntryProps) {
  const [expanded, setExpanded] = useState(false)
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string) => {
    setSectionsOpen((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const headingBlocks = experiment.heading_blocks ?? []

  return (
    <div className="bg-white border border-nb-cream-border rounded-[8px] mb-2 overflow-hidden font-nb-mono">
      {/* Collapsed header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-nb-muted hover:text-nb-charcoal transition-colors"
          aria-expanded={expanded}
        >
          <ChevronRight
            size={14}
            strokeWidth={1.5}
            className={cn('transition-transform duration-200', expanded && 'rotate-90')}
          />
        </button>

        <span
          className="flex-1 text-[15px] font-[600] text-nb-charcoal cursor-pointer hover:text-nb-green transition-colors"
          onClick={() => setExpanded((e) => !e)}
        >
          {experiment.name}
        </span>

        <span className="text-[11px] text-nb-muted-light shrink-0">
          {formatTimeAgo(experiment.created_at)}
        </span>

        <Link href={`/experiments/${experiment.id}/edit`}>
          <button className="p-1 text-nb-muted hover:text-nb-charcoal hover:bg-nb-cream rounded-[4px] transition-colors">
            <Pencil size={14} strokeWidth={1.5} />
          </button>
        </Link>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div
          className="border-t border-nb-cream-border px-4 py-4"
          style={{ animation: 'expandDown 200ms ease' }}
        >
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {experiment.project && <Badge variant="green">{experiment.project}</Badge>}
            {experiment.protocol_name && <Badge variant="gray">{experiment.protocol_name}</Badge>}
            {experiment.sample_name && <Badge variant="gray">{experiment.sample_name}</Badge>}
          </div>

          {/* Report sections */}
          {experiment.has_report && headingBlocks.length > 0 && (
            <div className="flex flex-col gap-1 mb-4">
              {headingBlocks.map((block) => (
                <div key={block.id} className="border border-nb-cream-border rounded-[6px] overflow-hidden">
                  <button
                    onClick={() => toggleSection(block.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-nb-cream transition-colors"
                  >
                    <ChevronRight
                      size={12}
                      strokeWidth={1.5}
                      className={cn('text-nb-muted transition-transform', sectionsOpen[block.id] && 'rotate-90')}
                    />
                    <span className="text-[13px] font-[600] text-nb-charcoal">{block.content}</span>
                  </button>
                  {sectionsOpen[block.id] && (
                    <div className="px-3 py-2 border-t border-nb-cream-border bg-nb-cream">
                      <p className="text-[13px] text-nb-muted italic">No content yet</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {experiment.has_report ? (
              <Link href={`/experiments/${experiment.id}/report`}>
                <Button variant="secondary" size="sm">View Report</Button>
              </Link>
            ) : (
              <Link href={`/experiments/${experiment.id}`}>
                <Button variant="primary" size="sm">
                  {experiment.report_template_id ? 'Generate Report' : 'View Experiment'}
                </Button>
              </Link>
            )}

            {(experiment.file_count ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-nb-muted">
                <Paperclip size={12} strokeWidth={1.5} />
                {experiment.file_count} file{(experiment.file_count ?? 0) > 1 ? 's' : ''} attached
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
