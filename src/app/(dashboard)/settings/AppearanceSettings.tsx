'use client'

import { useTheme } from '@/components/layout/ThemeProvider'

const ACCENT_OPTIONS = [
  { id: 'green' as const, label: 'Green', swatch: '#00AC73' },
  { id: 'purple' as const, label: 'Purple', swatch: '#C074FF' },
  { id: 'orange' as const, label: 'Orange', swatch: '#D65400' },
]

export default function AppearanceSettings() {
  const { accent, setAccent } = useTheme()

  return (
    <div className="bg-white border border-nb-cream-border rounded-[8px] p-6 font-nb-mono">
      <h2 className="text-[15px] font-[600] text-primary mb-3">Appearance</h2>
      <p className="text-[12px] text-nb-muted mb-4">
        Choose the accent color used for section titles across Sylvy.
      </p>

      <div className="flex items-center gap-3">
        {ACCENT_OPTIONS.map((option) => {
          const isActive = accent === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setAccent(option.id)}
              aria-pressed={isActive}
              aria-label={`Use ${option.label} accent`}
              className={`h-7 w-7 rounded-full border transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isActive
                  ? 'border-nb-green ring-nb-green scale-105'
                  : 'border-nb-cream-border hover:scale-105'
              }`}
              style={{ backgroundColor: option.swatch }}
            />
          )
        })}
      </div>
    </div>
  )
}

