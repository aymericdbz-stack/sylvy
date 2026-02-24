'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/nb/Button'
import Modal from '@/components/ui/nb/Modal'

interface ExperimentActionsProps {
  experimentId: string
  orgId: string
}

export default function ExperimentActions({ experimentId, orgId }: ExperimentActionsProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('experiments')
      .delete()
      .eq('id', experimentId)
      .eq('org_id', orgId)

    if (error) {
      toast.error('Failed to delete experiment')
      setDeleting(false)
      return
    }

    toast.success('Experiment deleted')
    router.push('/notebook')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        className="flex items-center gap-1.5 text-[13px] text-nb-muted hover:text-nb-error transition-colors px-3 py-2"
      >
        <Trash2 size={14} strokeWidth={1.5} />
        Delete
      </button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete experiment">
        <p className="text-[13px] text-nb-muted mb-6">
          This will permanently delete this experiment and all its files. This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  )
}
