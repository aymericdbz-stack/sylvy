'use client'

import { useState, useCallback, useRef } from 'react'
import { Image as ImageIcon, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { ReportBlock } from '@/lib/supabase/types'

interface ReportEditorProps {
  reportId: string
  blocks: ReportBlock[]
  experimentId: string
  orgId: string
}

export default function ReportEditor({ reportId, blocks: initialBlocks, experimentId, orgId }: ReportEditorProps) {
  const [blocks, setBlocks] = useState<ReportBlock[]>(initialBlocks)
  const [savingBlocks, setSavingBlocks] = useState<Record<string, 'saving' | 'saved'>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const saveBlock = useCallback(async (blockId: string, content: string | null, storageUrl?: string | null) => {
    const supabase = createClient()
    setSavingBlocks((prev) => ({ ...prev, [blockId]: 'saving' }))
    await supabase
      .from('report_blocks')
      .update({ content, ...(storageUrl !== undefined ? { storage_url: storageUrl } : {}) })
      .eq('id', blockId)
    setSavingBlocks((prev) => ({ ...prev, [blockId]: 'saved' }))
    setTimeout(() => setSavingBlocks((prev) => { const n = { ...prev }; delete n[blockId]; return n }), 2000)
  }, [])

  const handleTextChange = (blockId: string, content: string) => {
    setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, content } : b))
    clearTimeout(timers.current[blockId])
    timers.current[blockId] = setTimeout(() => saveBlock(blockId, content), 1500)
  }

  const handleImageUpload = async (blockId: string, file: File) => {
    if (file.size > 50 * 1024 * 1024) { toast.error('File exceeds 50MB'); return }
    const supabase = createClient()
    const path = `${orgId}/${experimentId}/report/${blockId}_${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('experiment-files').upload(path, file)
    if (error) { toast.error('Upload failed'); return }
    const { data: urlData } = supabase.storage.from('experiment-files').getPublicUrl(path)
    setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, storage_url: urlData.publicUrl } : b))
    await saveBlock(blockId, null, urlData.publicUrl)
    toast.success('Image uploaded')
  }

  const completedBlocks = blocks.filter((b) => b.type !== 'heading' && (b.content || b.storage_url)).length
  const totalFillable = blocks.filter((b) => b.type !== 'heading').length

  return (
    <div className="font-nb-mono">
      {/* Progress */}
      {totalFillable > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-nb-muted">{completedBlocks} / {totalFillable} sections completed</span>
          </div>
          <div className="h-1.5 bg-nb-cream-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-nb-green rounded-full transition-all duration-300"
              style={{ width: `${totalFillable ? (completedBlocks / totalFillable) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Blocks */}
      <div className="flex flex-col gap-6">
        {blocks.map((block) => {
          const saving = savingBlocks[block.id]

          if (block.type === 'heading') {
            return (
              <div key={block.id} className="flex items-center gap-3 border-l-[3px] border-nb-green pl-4 py-1">
                <h3 className="text-[18px] font-[600] text-nb-charcoal">{block.content}</h3>
              </div>
            )
          }

          if (block.type === 'text') {
            return (
              <div key={block.id} className="bg-white border border-nb-cream-border rounded-[8px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-[600] text-nb-muted uppercase tracking-[0.04em]">
                    Text
                  </label>
                  {saving && (
                    <span className={cn('text-[11px]', saving === 'saving' ? 'text-nb-muted-light' : 'text-nb-green')}>
                      {saving === 'saving' ? 'Saving...' : 'Saved ✓'}
                    </span>
                  )}
                </div>
                <textarea
                  value={block.content ?? ''}
                  onChange={(e) => handleTextChange(block.id, e.target.value)}
                  rows={6}
                  placeholder="Write your notes here..."
                  className="w-full text-[13px] text-nb-charcoal bg-transparent outline-none resize-y placeholder:text-nb-muted-light"
                />
              </div>
            )
          }

          if (block.type === 'data_table') {
            return (
              <div key={block.id} className="bg-white border border-nb-cream-border rounded-[8px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-[600] text-nb-muted uppercase tracking-[0.04em]">Data Table</label>
                  {saving && (
                    <span className={cn('text-[11px]', saving === 'saving' ? 'text-nb-muted-light' : 'text-nb-green')}>
                      {saving === 'saving' ? 'Saving...' : 'Saved ✓'}
                    </span>
                  )}
                </div>
                <textarea
                  value={block.content ?? ''}
                  onChange={(e) => handleTextChange(block.id, e.target.value)}
                  rows={5}
                  placeholder="Paste or type data..."
                  className="w-full text-[13px] text-nb-charcoal font-nb-mono bg-nb-cream rounded-[4px] p-3 outline-none resize-y placeholder:text-nb-muted-light"
                />
              </div>
            )
          }

          if (block.type === 'image_placeholder') {
            return (
              <div key={block.id} className="bg-white border border-nb-cream-border rounded-[8px] p-4">
                <label className="text-[11px] font-[600] text-nb-muted uppercase tracking-[0.04em] mb-3 block">Image</label>
                {block.storage_url ? (
                  <div>
                    <img src={block.storage_url} alt="Report image" className="max-h-[300px] object-contain rounded-[6px]" />
                    <button
                      onClick={() => document.getElementById(`img-upload-${block.id}`)?.click()}
                      className="mt-2 text-[13px] text-nb-muted hover:text-nb-charcoal transition-colors"
                    >
                      Replace image
                    </button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-nb-cream-border rounded-[8px] p-8 text-center cursor-pointer hover:border-nb-green hover:bg-nb-cream transition-colors"
                    onClick={() => document.getElementById(`img-upload-${block.id}`)?.click()}
                  >
                    <Upload size={20} strokeWidth={1.5} className="mx-auto mb-2 text-nb-muted" />
                    <p className="text-[13px] text-nb-muted">Click to upload image</p>
                  </div>
                )}
                <input
                  id={`img-upload-${block.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(block.id, e.target.files[0])}
                />
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
