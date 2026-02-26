'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/nb/Button'

interface TemplateBuilderProps {
  mode: 'create' | 'edit'
  templateId?: string
  defaultTitle?: string
  defaultContent?: string
  orgId: string
  userId: string
}

export default function TemplateBuilder({
  mode, templateId, defaultTitle = '', defaultContent = '', orgId, userId,
}: TemplateBuilderProps) {
  const router = useRouter()
  const [title, setTitle] = useState(defaultTitle)
  const [content, setContent] = useState(defaultContent)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Template title is required'); return }
    setSaving(true)
    const supabase = createClient()

    const { data: template, error } = await supabase
      .from('report_templates')
      .upsert({ id: templateId, title: title.trim(), owner_id: userId, org_id: orgId })
      .select('id')
      .single()

    if (error || !template) { toast.error('Failed to save template'); setSaving(false); return }

    await supabase.from('template_blocks').delete().eq('template_id', template.id)

    if (content.trim()) {
      const { error: bErr } = await supabase
        .from('template_blocks')
        .insert({ template_id: template.id, type: 'text', content: content.trim(), order: 1 })
      if (bErr) { toast.error('Failed to save template content'); setSaving(false); return }
    }

    toast.success(mode === 'create' ? 'Template created' : 'Template saved')
    router.push('/templates')
    setSaving(false)
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/templates">
          <button className="flex items-center gap-1.5 text-[13px] text-nb-muted hover:text-nb-charcoal transition-colors mb-4">
            <ArrowLeft size={14} strokeWidth={1.5} />
            Templates
          </button>
        </Link>
        <h1 className="text-[22px] font-[700] text-nb-charcoal">
          {mode === 'create' ? 'New Template' : 'Edit Template'}
        </h1>
      </div>

      <div className="bg-white border border-nb-cream-border rounded-[8px] p-6 max-w-[640px]">
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-[11px] font-[600] text-nb-muted uppercase tracking-[0.04em] mb-1.5 font-nb-mono">
              Template Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Western Blot Report"
              className="w-full px-3 py-2 text-[13px] font-nb-mono border border-nb-cream-border rounded-[6px] text-nb-charcoal placeholder:text-nb-muted focus:outline-none focus:ring-1 focus:ring-nb-green"
            />
          </div>

          <div>
            <label className="block text-[11px] font-[600] text-nb-muted uppercase tracking-[0.04em] mb-1.5 font-nb-mono">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the template content here..."
              rows={12}
              className="w-full px-3 py-2 text-[13px] font-nb-mono border border-nb-cream-border rounded-[6px] text-nb-charcoal placeholder:text-nb-muted focus:outline-none focus:ring-1 focus:ring-nb-green resize-y"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-nb-cream-border">
            <Link href="/templates">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {mode === 'create' ? 'Create Template' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
