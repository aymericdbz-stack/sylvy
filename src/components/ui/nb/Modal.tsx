'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-nb-charcoal/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={cn('relative bg-white rounded-[10px] border border-nb-cream-border p-8 w-full mx-4 mt-[15vh] font-nb-mono max-w-[480px]', className)}>
        <div className="flex items-center justify-between mb-6">
          {title && <h2 className="text-[15px] font-[600] text-nb-charcoal">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto text-nb-muted hover:text-nb-charcoal transition-colors p-1 rounded-[4px] hover:bg-nb-cream"
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
