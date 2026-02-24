'use client'

import { X, GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import type { TemplateBlock } from '@/lib/supabase/types'

type BlockType = TemplateBlock['type']

const TYPE_LABELS: Record<BlockType, string> = {
  heading: 'Heading',
  text: 'Text',
  image_placeholder: 'Image',
  data_table: 'Table',
}

const PLACEHOLDERS: Record<BlockType, string> = {
  heading: 'Section title...',
  text: 'Describe what should go here...',
  image_placeholder: 'Image description / instructions...',
  data_table: 'Table description...',
}

interface BlockEditorProps {
  block: { localId: string; type: BlockType; content: string; order: number }
  onUpdate: (updates: { type?: BlockType; content?: string }) => void
  onRemove: () => void
}

export default function BlockEditor({ block, onUpdate, onRemove }: BlockEditorProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.localId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? '1.02' : '1',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 bg-white border border-nb-cream-border rounded-[8px] p-4 font-nb-mono"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 text-nb-muted-light hover:text-nb-muted cursor-grab active:cursor-grabbing transition-colors shrink-0"
      >
        <GripVertical size={16} strokeWidth={1.5} />
      </button>

      <div className="flex-1 min-w-0">
        {/* Type selector */}
        <div className="flex items-center gap-1 mb-3">
          {(Object.keys(TYPE_LABELS) as BlockType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onUpdate({ type })}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-[600] transition-all duration-150',
                block.type === type
                  ? 'bg-nb-green text-white'
                  : 'text-nb-muted hover:text-nb-charcoal hover:bg-nb-cream'
              )}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* Content textarea */}
        <textarea
          value={block.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder={PLACEHOLDERS[block.type]}
          rows={block.type === 'heading' ? 1 : 3}
          className="w-full text-[13px] text-nb-charcoal bg-transparent outline-none resize-none placeholder:text-nb-muted-light"
        />
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="mt-1 text-nb-muted-light hover:text-nb-error transition-colors shrink-0"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  )
}
