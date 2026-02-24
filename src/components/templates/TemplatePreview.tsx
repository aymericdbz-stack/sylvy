import { Image, Table } from 'lucide-react'
import type { TemplateBlock } from '@/lib/supabase/types'

type BlockType = TemplateBlock['type']

interface PreviewBlock {
  localId: string
  type: BlockType
  content: string
}

interface TemplatePreviewProps {
  title: string
  blocks: PreviewBlock[]
}

export default function TemplatePreview({ title, blocks }: TemplatePreviewProps) {
  return (
    <div className="bg-white border border-nb-cream-border rounded-[8px] p-5 font-nb-mono">
      {title ? (
        <h2 className="text-[15px] font-[700] text-nb-charcoal mb-4 pb-2 border-b border-nb-cream-border">
          {title}
        </h2>
      ) : (
        <div className="h-5 bg-nb-cream-dark rounded-[4px] mb-4 animate-pulse" />
      )}

      <div className="flex flex-col gap-3">
        {blocks.map((block) => {
          if (block.type === 'heading') {
            return (
              <div key={block.localId} className="border-l-[3px] border-nb-green pl-3 py-0.5">
                <p className="text-[13px] font-[600] text-nb-charcoal">
                  {block.content || <span className="text-nb-muted-light italic">Section title</span>}
                </p>
              </div>
            )
          }
          if (block.type === 'text') {
            return (
              <div key={block.localId} className="h-10 bg-nb-cream rounded-[4px] flex items-center px-3">
                <span className="text-[11px] text-nb-muted-light italic">Text block</span>
              </div>
            )
          }
          if (block.type === 'image_placeholder') {
            return (
              <div key={block.localId} className="border-2 border-dashed border-nb-cream-border rounded-[6px] h-16 flex items-center justify-center gap-2 text-nb-muted-light">
                <Image size={14} strokeWidth={1.5} />
                <span className="text-[11px]">Image</span>
              </div>
            )
          }
          return (
            <div key={block.localId} className="border border-nb-cream-border rounded-[6px] h-12 flex items-center justify-center gap-2 text-nb-muted-light">
              <Table size={14} strokeWidth={1.5} />
              <span className="text-[11px]">Data table</span>
            </div>
          )
        })}

        {blocks.length === 0 && (
          <p className="text-[11px] text-nb-muted-light italic text-center py-4">
            Add blocks to preview
          </p>
        )}
      </div>
    </div>
  )
}
