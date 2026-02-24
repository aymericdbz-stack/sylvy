'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/nb/Button'
import BlockEditor from './BlockEditor'
import TemplatePreview from './TemplatePreview'
import type { TemplateBlock } from '@/lib/supabase/types'

type BlockType = TemplateBlock['type']

interface LocalBlock {
  localId: string
  type: BlockType
  content: string
  order: number
}

interface TemplateBuilderProps {
  mode: 'create' | 'edit'
  templateId?: string
  defaultTitle?: string
  defaultBlocks?: LocalBlock[]
  orgId: string
  userId: string
}

export default function TemplateBuilder({
  mode, templateId, defaultTitle = '', defaultBlocks = [], orgId, userId,
}: TemplateBuilderProps) {
  const router = useRouter()
  const [title, setTitle] = useState(defaultTitle)
  const [blocks, setBlocks] = useState<LocalBlock[]>(defaultBlocks)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const addBlock = () => {
    setBlocks((prev) => [
      ...prev,
      { localId: crypto.randomUUID(), type: 'text', content: '', order: prev.length },
    ])
  }

  const updateBlock = useCallback((localId: string, updates: Partial<LocalBlock>) => {
    setBlocks((prev) => prev.map((b) => b.localId === localId ? { ...b, ...updates } : b))
  }, [])

  const removeBlock = useCallback((localId: string) => {
    setBlocks((prev) => prev.filter((b) => b.localId !== localId).map((b, i) => ({ ...b, order: i })))
  }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex((b) => b.localId === active.id)
    const newIndex = blocks.findIndex((b) => b.localId === over.id)
    setBlocks(arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, order: i })))
  }

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Template title is required'); return }
    setSaving(true)
    const supabase = createClient()

    const { data: template, error } = await supabase
      .from('report_templates')
      .upsert({ id: templateId, title: title.trim(), owner_id: userId, org_id: orgId })
      .select('id')
      .single()

    if (error) { toast.error('Failed to save template'); setSaving(false); return }

    await supabase.from('template_blocks').delete().eq('template_id', template.id)

    if (blocks.length > 0) {
      const { error: bErr } = await supabase.from('template_blocks').insert(
        blocks.map((b, i) => ({ template_id: template.id, type: b.type, content: b.content, order: i }))
      )
      if (bErr) { toast.error('Failed to save blocks'); setSaving(false); return }
    }

    toast.success(mode === 'create' ? 'Template created' : 'Template saved')
    if (mode === 'create') router.push('/templates')
    else router.refresh()
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
      </div>

      <div className="flex gap-6">
        {/* Editor panel */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Template title..."
            className="w-full text-[22px] font-[700] text-nb-charcoal bg-transparent outline-none border-b border-transparent focus:border-nb-green pb-1 mb-6 font-nb-mono placeholder:text-nb-cream-border transition-colors"
          />

          {/* Blocks */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.localId)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                {blocks.map((block) => (
                  <BlockEditor
                    key={block.localId}
                    block={block}
                    onUpdate={(updates) => updateBlock(block.localId, updates)}
                    onRemove={() => removeBlock(block.localId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={addBlock}
            className="mt-4 flex items-center gap-2 text-[13px] text-nb-muted hover:text-nb-green transition-colors font-nb-mono"
          >
            <Plus size={14} strokeWidth={1.5} />
            Add block
          </button>

          <div className="mt-6 flex justify-end">
            <Button variant="primary" loading={saving} onClick={handleSave}>
              Save Template
            </Button>
          </div>
        </div>

        {/* Preview panel */}
        <div className="w-[300px] shrink-0">
          <p className="text-[11px] font-[600] text-nb-muted uppercase tracking-[0.04em] mb-3">Preview</p>
          <TemplatePreview title={title} blocks={blocks} />
        </div>
      </div>
    </div>
  )
}
