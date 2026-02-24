'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface ProtocolActionsProps {
  protocolId: string
  orgId: string
}

export default function ProtocolActions({ protocolId, orgId }: ProtocolActionsProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('protocols').delete().eq('id', protocolId).eq('org_id', orgId)
    if (error) { toast.error('Failed to delete'); setDeleting(false); return }
    toast.success('Protocol deleted')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/protocols/${protocolId}/edit`}>
        <button className="p-1.5 text-nb-muted hover:text-nb-charcoal hover:bg-nb-cream rounded-[4px] transition-colors">
          <Pencil size={14} strokeWidth={1.5} />
        </button>
      </Link>

      {confirming ? (
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[11px] text-nb-error font-[600] hover:opacity-70 transition-opacity"
          >
            {deleting ? '...' : 'Confirm?'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-[11px] text-nb-muted hover:text-nb-charcoal transition-colors ml-1"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="p-1.5 text-nb-muted hover:text-nb-error hover:bg-red-50 rounded-[4px] transition-colors"
        >
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      )}
    </div>
  )
}
