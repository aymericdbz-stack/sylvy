'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { getTimezone, setTimezone } from '@/lib/preferences'
import Button from '@/components/ui/nb/Button'

// Common timezones grouped by region
const TIMEZONES = [
  { group: 'Europe', options: [
    'Europe/Paris', 'Europe/London', 'Europe/Berlin', 'Europe/Madrid',
    'Europe/Rome', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Zurich',
    'Europe/Stockholm', 'Europe/Warsaw', 'Europe/Helsinki', 'Europe/Lisbon',
  ]},
  { group: 'Amérique', options: [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'America/Mexico_City',
  ]},
  { group: 'Asie / Pacifique', options: [
    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Seoul',
    'Asia/Dubai', 'Asia/Kolkata', 'Asia/Hong_Kong', 'Australia/Sydney',
  ]},
  { group: 'UTC', options: ['UTC'] },
]

export default function PreferencesSettings() {
  const [selected, setSelected] = useState<string>('UTC')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSelected(getTimezone())
  }, [])

  function handleSave() {
    setTimezone(selected)
    setSaved(true)
    toast.success('Préférences enregistrées')
    // Dispatch storage event so other tabs/components update
    window.dispatchEvent(new Event('storage'))
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[15px] font-[700] text-nb-charcoal font-nb-mono mb-1">Préférences</h2>
        <p className="text-[12px] text-nb-muted font-nb-mono">
          Paramètres personnels stockés localement sur cet appareil.
        </p>
      </div>

      {/* Timezone */}
      <div className="bg-white border border-nb-cream-border rounded-[8px] p-5 flex flex-col gap-4">
        <div>
          <label className="text-[12px] font-[700] text-nb-charcoal font-nb-mono block mb-0.5">
            Fuseau horaire
          </label>
          <p className="text-[11px] text-nb-muted font-nb-mono">
            Utilisé pour l&apos;affichage du calendrier et la création d&apos;événements.
          </p>
        </div>

        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="w-full max-w-[320px] bg-white border border-nb-cream-border rounded-[6px] px-3 py-2 text-[13px] text-nb-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-nb-green/40 focus:border-nb-green/60"
        >
          {TIMEZONES.map(group => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map(tz => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <div className="text-[11px] text-nb-muted font-nb-mono">
          Détecté par le navigateur :{' '}
          <span className="text-nb-charcoal font-[600]">
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          className="w-fit"
        >
          {saved ? 'Enregistré ✓' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}
