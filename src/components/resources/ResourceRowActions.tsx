'use client'

import { useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'

interface ResourceRowActionsProps {
  onDelete: () => void
  onEdit?: () => void
}

export default function ResourceRowActions({ onDelete, onEdit }: ResourceRowActionsProps) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={onDelete} className="text-[11px] text-nb-error font-[600] hover:opacity-70">
          Confirm?
        </button>
        <button onClick={() => setConfirming(false)} className="text-[11px] text-nb-muted hover:text-nb-charcoal">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5">
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 text-nb-muted hover:text-nb-charcoal hover:bg-nb-cream rounded-[4px] transition-colors"
          aria-label="Edit"
        >
          <Pencil size={14} strokeWidth={1.5} />
        </button>
      )}
      <button
        onClick={() => setConfirming(true)}
        className="p-1.5 text-nb-muted hover:text-nb-error hover:bg-red-50 rounded-[4px] transition-colors"
      >
        <Trash2 size={14} strokeWidth={1.5} />
      </button>
    </div>
  )
}
