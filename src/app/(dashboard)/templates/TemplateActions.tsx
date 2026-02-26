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
  const [duplicating, setDuplicating] = useState(false)

  const handleDelete = async () => {
    const supabase = createClient()
    const { error } = await supabase.from('report_templates').delete().eq('id', templateId).eq('org_id', orgId)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Template deleted')
    router.refresh()
  }

  const handleDuplicate = async () => {
    try {
      setDuplicating(true)
      const supabase = createClient()

      // 1) Fetch original template
      const { data: template, error: tErr } = await supabase
        .from('report_templates')
        .select('id, title, owner_id')
        .eq('id', templateId)
        .eq('org_id', orgId)
        .single()

      if (tErr || !template) {
        toast.error('Failed to load template')
        return
      }

      // 2) Fetch its blocks (ordered)
      const { data: blocks, error: bErr } = await supabase
        .from('template_blocks')
        .select('type, content, "order"')
        .eq('template_id', templateId)
        .order('order', { ascending: true })

      if (bErr) {
        toast.error('Failed to load template blocks')
        return
      }

      // 3) Create new template with " - Copy" suffix
      const newTitle = `${template.title} - Copy`
      const { data: newTemplate, error: nErr } = await supabase
        .from('report_templates')
        .insert({
          org_id: orgId,
          owner_id: template.owner_id,
          title: newTitle,
        })
        .select('id')
        .single()

      if (nErr || !newTemplate) {
        toast.error('Failed to create copy')
        return
      }

      // 4) Copy blocks to the new template
      if (blocks && blocks.length > 0) {
        const { error: insertBlocksErr } = await supabase.from('template_blocks').insert(
          blocks.map((b) => ({
            template_id: newTemplate.id,
            type: b.type,
            content: b.content,
            order: b.order,
          }))
        )
        if (insertBlocksErr) {
          toast.error('Template duplicated but blocks failed to copy')
          router.refresh()
          return
        }
      }

      toast.success('Template duplicated')
      router.refresh()
    } finally {
      setDuplicating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/templates/${templateId}/edit`}>
        <button className="p-1.5 text-nb-muted hover:text-nb-charcoal hover:bg-nb-cream rounded-[4px] transition-colors">
          <Pencil size={14} strokeWidth={1.5} />
        </button>
      </Link>
      <button
        onClick={handleDuplicate}
        disabled={duplicating}
        className="p-1.5 text-nb-muted hover:text-nb-charcoal hover:bg-nb-cream rounded-[4px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
