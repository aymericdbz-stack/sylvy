'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { getTimezone, setTimezone, getWorkHours, setWorkHours } from '@/lib/preferences'
import Button from '@/components/ui/nb/Button'

// Common timezones grouped by region
const TIMEZONES = [
  { group: 'Europe', options: [
    'Europe/Paris', 'Europe/London', 'Europe/Berlin', 'Europe/Madrid',
    'Europe/Rome', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Zurich',
    'Europe/Stockholm', 'Europe/Warsaw', 'Europe/Helsinki', 'Europe/Lisbon',
  ]},
  { group: 'Americas', options: [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'America/Mexico_City',
  ]},
  { group: 'Asia / Pacific', options: [
    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Seoul',
    'Asia/Dubai', 'Asia/Kolkata', 'Asia/Hong_Kong', 'Australia/Sydney',
  ]},
  { group: 'UTC', options: ['UTC'] },
]

const HOURS = Array.from({ length: 25 }, (_, i) => i)  // 0h → 24h

export default function PreferencesSettings() {
  const [selectedTz,   setSelectedTz]   = useState<string>('UTC')
  const [workStart,    setWorkStart]    = useState<number>(0)
  const [workEnd,      setWorkEnd]      = useState<number>(24)
  const [saved,        setSaved]        = useState(false)

  useEffect(() => {
    setSelectedTz(getTimezone())
    const wh = getWorkHours()
    setWorkStart(wh.start)
    setWorkEnd(wh.end)
  }, [])

  function handleSave() {
    setTimezone(selectedTz)
    setWorkHours(workStart, workEnd)
    setSaved(true)
    toast.success('Préférences enregistrées')
    window.dispatchEvent(new Event('storage'))
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[15px] font-[700] text-nb-charcoal font-nb-mono mb-1">Preferences</h2>
        <p className="text-[12px] text-nb-muted font-nb-mono">
          Personal settings stored locally on this device.
        </p>
      </div>

      {/* Timezone */}
      <div className="bg-white border border-nb-cream-border rounded-[8px] p-5 flex flex-col gap-4">
        <div>
          <label className="text-[12px] font-[700] text-nb-charcoal font-nb-mono block mb-0.5">
            Timezone
          </label>
          <p className="text-[11px] text-nb-muted font-nb-mono">
            Used for calendar display and event creation.
          </p>
        </div>

        <select
          value={selectedTz}
          onChange={e => setSelectedTz(e.target.value)}
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
          Detected by browser:{' '}
          <span className="text-nb-charcoal font-[600]">
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </span>
        </div>
      </div>

      {/* Working hours */}
      <div className="bg-white border border-nb-cream-border rounded-[8px] p-5 flex flex-col gap-4">
        <div>
          <label className="text-[12px] font-[700] text-nb-charcoal font-nb-mono block mb-0.5">
            Work hours
          </label>
          <p className="text-[11px] text-nb-muted font-nb-mono">
            Time range respected by the scheduling algorithm (Monday–Friday).
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-[600] text-nb-muted uppercase tracking-[0.06em] font-nb-mono">
              Start
            </label>
            <select
              value={workStart}
              onChange={e => setWorkStart(Number(e.target.value))}
              className="bg-white border border-nb-cream-border rounded-[6px] px-3 py-2 text-[13px] text-nb-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-nb-green/40"
            >
              {HOURS.filter(h => h < workEnd).map(h => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>

          <span className="text-[14px] text-nb-muted-light font-nb-mono mt-5">→</span>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-[600] text-nb-muted uppercase tracking-[0.06em] font-nb-mono">
              End
            </label>
            <select
              value={workEnd}
              onChange={e => setWorkEnd(Number(e.target.value))}
              className="bg-white border border-nb-cream-border rounded-[6px] px-3 py-2 text-[13px] text-nb-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-nb-green/40"
            >
              {HOURS.filter(h => h > workStart).map(h => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-nb-muted font-nb-mono mt-5">
            ({workEnd - workStart}h per day)
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={handleSave}
        className="w-fit"
      >
        {saved ? 'Saved ✓' : 'Save'}
      </Button>
    </div>
  )
}
