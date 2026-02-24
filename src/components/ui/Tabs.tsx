'use client'

import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export default function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-1.5 rounded-full text-[13px] font-nb-mono transition-all duration-150',
            active === tab.id
              ? 'bg-nb-green text-white font-[600]'
              : 'text-nb-muted hover:text-nb-charcoal'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
