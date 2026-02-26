'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Folder, FlaskConical, ChevronRight, Plus, TestTube2 } from 'lucide-react'
import CreateItemModal from './CreateItemModal'
import Button from '@/components/ui/nb/Button'
import { createProjectAction } from '@/app/(dashboard)/notebook/actions'
import { cn, formatTimeAgo } from '@/lib/utils'

interface ManipulationSummary {
  id: string
  name: string
  created_at: string
}

interface ExperimentSetSummary {
  id: string
  name: string
  created_at: string
  manipulation_count: number
  manipulations: ManipulationSummary[]
}

interface ProjectData {
  id: string
  name: string
  created_at: string
  experiment_count: number
  manipulation_count: number
  experiment_sets?: ExperimentSetSummary[]
}

interface ProjectListClientProps {
  projects: ProjectData[]
}

export default function ProjectListClient({ projects }: ProjectListClientProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [expandedExperimentId, setExpandedExperimentId] = useState<string | null>(null)

  const toggleProject = (projectId: string) => {
    setExpandedProjectId((current) => (current === projectId ? null : projectId))
  }

  const toggleExperiment = (experimentId: string) => {
    setExpandedExperimentId((current) => (current === experimentId ? null : experimentId))
  }

  return (
    <>
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-nb-cream-dark flex items-center justify-center mb-4">
            <span className="text-[24px]">🔬</span>
          </div>
          <p className="text-[15px] font-[600] text-nb-charcoal mb-1">No projects yet</p>
          <p className="text-[13px] text-nb-muted mb-6">
            Create your first project to start organizing your experiments.
          </p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => {
            const isExpanded = expandedProjectId === project.id
            const experimentSets = project.experiment_sets ?? []

            return (
              <div
                key={project.id}
                className="bg-white border border-nb-cream-border rounded-[8px] overflow-hidden font-nb-mono"
              >
                {/* Project row */}
                <button
                  type="button"
                  onClick={() => toggleProject(project.id)}
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

                  <Folder size={18} strokeWidth={1.5} className="text-nb-green shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[15px] font-[600] text-nb-charcoal">
                        {project.name}
                      </span>
                      <span className="text-[11px] text-nb-muted-light shrink-0">
                        {formatTimeAgo(project.created_at)}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-nb-muted-light">
                      <span>
                        {project.experiment_count} experiment
                        {project.experiment_count !== 1 ? 's' : ''}
                      </span>
                      <span className="h-3 w-px bg-nb-cream-border" />
                      <span>
                        {project.manipulation_count} manipulation
                        {project.manipulation_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Experiment sets dropdown */}
                {isExpanded && (
                  <div className="border-t border-nb-cream-border bg-nb-cream-light px-4 py-3 space-y-2">
                    {experimentSets.length === 0 ? (
                      <p className="text-[12px] text-nb-muted">
                        No experiments in this project yet.
                      </p>
                    ) : (
                      experimentSets.map((set) => {
                        const isExperimentExpanded = expandedExperimentId === set.id

                        return (
                          <div
                            key={set.id}
                            className="bg-white rounded-[6px] border border-nb-cream-border overflow-hidden"
                          >
                            {/* Experiment row */}
                            <button
                              type="button"
                              onClick={() => toggleExperiment(set.id)}
                              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-nb-cream transition-colors"
                              aria-expanded={isExperimentExpanded}
                            >
                              <ChevronRight
                                size={12}
                                strokeWidth={1.5}
                                className={cn(
                                  'text-nb-muted-light transition-transform duration-200',
                                  isExperimentExpanded && 'rotate-90'
                                )}
                              />

                              <FlaskConical
                                size={16}
                                strokeWidth={1.5}
                                className="text-nb-green shrink-0"
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate text-[13px] font-[600] text-nb-charcoal">
                                    {set.name}
                                  </span>
                                  <span className="text-[11px] text-nb-muted-light shrink-0">
                                    {formatTimeAgo(set.created_at)}
                                  </span>
                                </div>
                                <span className="mt-0.5 block text-[11px] text-nb-muted-light">
                                  {set.manipulation_count} manipulation
                                  {set.manipulation_count !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </button>

                            {/* Manipulations dropdown */}
                            {isExperimentExpanded && (
                              <div className="border-t border-nb-cream-border bg-nb-cream-light px-3 py-2 space-y-2">
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
                                        size={14}
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
                                    href={`/notebook/${project.id}/${set.id}`}
                                    className="text-nb-green font-[600] hover:underline"
                                  >
                                    Open experiment page →
                                  </Link>
                                  <Link
                                    href={`/experiments/new?experiment_set_id=${set.id}&project_id=${project.id}`}
                                    className="text-nb-green font-[600] hover:underline"
                                  >
                                    Start new manipulation →
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
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
            New Project
          </button>
        </div>
      )}

      <CreateItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Project"
        placeholder="e.g. CRISPR Screen Q2"
        action={async (name) => {
          await createProjectAction(name)
        }}
      />
    </>
  )
}
