'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import FolderItem from './FolderItem'
import CreateItemModal from './CreateItemModal'
import Button from '@/components/ui/nb/Button'
import { createProjectAction } from '@/app/(dashboard)/notebook/actions'

interface ProjectData {
  id: string
  name: string
  created_at: string
  experiment_count: number
  manipulation_count: number
}

interface ProjectListClientProps {
  projects: ProjectData[]
}

export default function ProjectListClient({ projects }: ProjectListClientProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-nb-cream-dark flex items-center justify-center mb-4">
            <span className="text-[24px]">🔬</span>
          </div>
          <p className="text-[15px] font-[600] text-nb-charcoal mb-1">No projects yet</p>
          <p className="text-[13px] text-nb-muted mb-6">Create your first project to start organizing your experiments.</p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Create your first project
          </Button>
        </div>
      ) : (
        <div>
          {projects.map((project) => (
            <FolderItem
              key={project.id}
              name={project.name}
              href={`/notebook/${project.id}`}
              itemCount={project.experiment_count}
              itemLabel="experiment"
              createdAt={project.created_at}
            />
          ))}
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
        action={async (name) => { await createProjectAction(name) }}
      />
    </>
  )
}
