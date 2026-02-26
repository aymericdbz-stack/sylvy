'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import FolderItem from './FolderItem'
import CreateItemModal from './CreateItemModal'
import Button from '@/components/ui/nb/Button'
import { createExperimentSetAction } from '@/app/(dashboard)/notebook/actions'

interface ExperimentSetData {
  id: string
  name: string
  created_at: string
  manipulation_count: number
}

interface ExperimentSetListClientProps {
  experimentSets: ExperimentSetData[]
  projectId: string
}

export default function ExperimentSetListClient({ experimentSets, projectId }: ExperimentSetListClientProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      {experimentSets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-nb-cream-dark flex items-center justify-center mb-4">
            <span className="text-[24px]">🧪</span>
          </div>
          <p className="text-[15px] font-[600] text-nb-charcoal mb-1">No experiments yet</p>
          <p className="text-[13px] text-nb-muted mb-6">Create your first experiment in this project.</p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Create your first experiment
          </Button>
        </div>
      ) : (
        <div>
          {experimentSets.map((set) => (
            <FolderItem
              key={set.id}
              name={set.name}
              href={`/notebook/${projectId}/${set.id}`}
              itemCount={set.manipulation_count}
              itemLabel="manipulation"
              createdAt={set.created_at}
            />
          ))}
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
        action={async (name) => { await createExperimentSetAction(name, projectId) }}
      />
    </>
  )
}
