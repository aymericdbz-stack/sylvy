'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, FlaskConical, Plus, TestTube2 } from 'lucide-react'
import CreateItemModal from './CreateItemModal'
import Button from '@/components/ui/nb/Button'
import { createExperimentSetAction } from '@/app/(dashboard)/notebook/actions'
import { cn, formatTimeAgo } from '@/lib/utils'

interface ManipulationSummary {
  id: string
  name: string
  created_at: string
}

interface ExperimentSetData {
  id: string
  name: string
  created_at: string
  manipulation_count: number
  manipulations: ManipulationSummary[]
}

interface ExperimentSetListClientProps {
  experimentSets: ExperimentSetData[]
  projectId: string
}

export default function ExperimentSetListClient({ experimentSets, projectId }: ExperimentSetListClientProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleSet = (id: string) => {
    setExpandedId((current) => (current === id ? null : id))
  }

  return (
    <>
      {experimentSets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-nb-cream-dark flex items-center justify-center mb-4">
            <span className="text-[24px]">🧪</span>
          </div>
          <p className="text-[15px] font-[600] text-nb-charcoal mb-1">No experiments yet</p>
          <p className="text-[13px] text-nb-muted mb-6">
            Create your first experiment in this project.
          </p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Create your first experiment
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {experimentSets.map((set) => {
            const isExpanded = expandedId === set.id

            return (
              <div
                key={set.id}
                className="bg-white border border-nb-cream-border rounded-[8px] overflow-hidden font-nb-mono"
              >
                {/* Experiment row */}
                <button
                  type="button"
                  onClick={() => toggleSet(set.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-nb-cream transition-colors"
                  aria-expanded={isExpanded}
                >
                  <ChevronRight
                    size={14}
                    strokeWidth={1.5}
                    className={cn(
                      'text-nb-muted-light transition-transform duration-200',
                      isExpanded && 'rotate-90'
                    )}
                  />

                  <FlaskConical size={18} strokeWidth={1.5} className="text-nb-green shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[15px] font-[600] text-nb-charcoal">
                        {set.name}
                      </span>
                      <span className="text-[11px] text-nb-muted-light shrink-0">
                        {formatTimeAgo(set.created_at)}
                      </span>
                    </div>

                    <div className="mt-1 text-[11px] text-nb-muted-light">
                      {set.manipulation_count} manipulation
                      {set.manipulation_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </button>

                {/* Manipulations dropdown */}
                {isExpanded && (
                  <div className="border-t border-nb-cream-border bg-nb-cream-light px-4 py-3 space-y-2">
                    {set.manipulations.length === 0 ? (
                      <p className="text-[12px] text-nb-muted">
                        No manipulations in this experiment yet.
                      </p>
                    ) : (
                      set.manipulations.map((m) => (
                        <Link
                          key={m.id}
                          href={`/experiments/${m.id}`}
                          className="flex items-center gap-3 px-3 py-2 bg-white rounded-[6px] border border-nb-cream-border hover:border-nb-green/40 hover:shadow-sm transition-all duration-150"
                        >
                          <TestTube2
                            size={16}
                            strokeWidth={1.5}
                            className="text-nb-green shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-[13px] font-[600] text-nb-charcoal">
                                {m.name}
                              </span>
                              <span className="text-[11px] text-nb-muted-light shrink-0">
                                {formatTimeAgo(m.created_at)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}

                    <div className="pt-1 flex flex-wrap gap-3 text-[12px]">
                      <Link
                        href={`/notebook/${projectId}/${set.id}`}
                        className="text-nb-green font-[600] hover:underline"
                      >
                        Open experiment page →
                      </Link>
                      <Link
                        href={`/experiments/new?experiment_set_id=${set.id}&project_id=${projectId}`}
                        className="text-nb-green font-[600] hover:underline"
                      >
                        Start new manipulation →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3 text-[13px] text-nb-green font-[600] font-nb-mono hover:bg-nb-green-light rounded-[8px] transition-colors w-full mt-1"
          >
            <Plus size={14} strokeWidth={1.5} />
            New Experiment
          </button>
        </div>
      )}

      <CreateItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Experiment"
        placeholder="e.g. ELISA Assay"
        action={async (name) => {
          await createExperimentSetAction(name, projectId)
        }}
      />
    </>
  )
}
