'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Copy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function TemplateActions({ templateId, orgId }: { templateId: string; orgId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  const handleDelete = async () => {
    const supabase = createClient()
    const { error } = await supabase.from('report_templates').delete().eq('id', templateId).eq('org_id', orgId)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Template deleted')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/templates/${templateId}/edit`}>
        <button className="p-1.5 text-nb-muted hover:text-nb-charcoal hover:bg-nb-cream rounded-[4px] transition-colors">
          <Pencil size={14} strokeWidth={1.5} />
        </button>
      </Link>
      <button
        onClick={() => toast.info('Duplicate feature coming soon')}
        className="p-1.5 text-nb-muted hover:text-nb-charcoal hover:bg-nb-cream rounded-[4px] transition-colors"
      >
        <Copy size={14} strokeWidth={1.5} />
      </button>
      {confirming ? (
        <div className="flex items-center gap-1">
          <button onClick={handleDelete} className="text-[11px] text-nb-error font-[600] hover:opacity-70">Confirm?</button>
          <button onClick={() => setConfirming(false)} className="text-[11px] text-nb-muted hover:text-nb-charcoal ml-1">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} className="p-1.5 text-nb-muted hover:text-nb-error hover:bg-red-50 rounded-[4px] transition-colors">
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      )}
    </div>
  )
}
