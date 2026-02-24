'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
}

export default function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-nb-charcoal text-white text-[11px] font-nb-mono px-2 py-1 rounded-[4px] whitespace-nowrap max-w-[200px] text-center">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
