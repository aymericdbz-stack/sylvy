'use client'

import { useTheme } from '@/components/layout/ThemeProvider'

const ACCENT_OPTIONS = [
  { id: 'green' as const, label: 'Green', swatch: '#00AC73' },
  { id: 'purple' as const, label: 'Purple', swatch: '#C074FF' },
  { id: 'orange' as const, label: 'Orange', swatch: '#D65400' },
]

export default function AppearanceSettings() {
  const { accent, setAccent, mode, toggleMode } = useTheme()

  return (
    <div className="bg-white border border-nb-cream-border rounded-[8px] p-6 font-nb-mono">
      <h2 className="text-[15px] font-[600] text-primary mb-3">Appearance</h2>

      {/* Theme mode */}
      <p className="text-[12px] text-nb-muted mb-3">Interface mode</p>
      <div className="flex items-center gap-2 mb-6">
        {(['light', 'dark'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { if (mode !== m) toggleMode() }}
            aria-pressed={mode === m}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[12px] font-[500] border transition-colors ${
              mode === m
                ? 'bg-nb-charcoal text-white border-nb-charcoal'
                : 'bg-white text-nb-muted border-nb-cream-border hover:text-nb-charcoal'
            }`}
          >
            <span className="relative inline-flex h-3.5 w-3.5 overflow-hidden rounded-full border border-current flex-shrink-0">
              {m === 'light'
                ? <><span className="h-full w-1/2 bg-current" /><span className="h-full w-1/2 bg-transparent" /></>
                : <><span className="h-full w-1/2 bg-current" /><span className="h-full w-1/2 bg-current" /></>
              }
            </span>
            {m === 'light' ? 'Light' : 'Dark'}
          </button>
        ))}
      </div>

      {/* Accent color */}
      <p className="text-[12px] text-nb-muted mb-3">
        Accent color
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

