'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getWorkHours, setWorkHours, getPlannerWeekendsEnabled } from '@/lib/preferences'
import Button from '@/components/ui/nb/Button'

const HOURS = Array.from({ length: 25 }, (_, i) => i) // 0h → 24h

export default function PlannerSettings() {
  const [workStart, setWorkStart] = useState<number>(9)
  const [workEnd, setWorkEnd] = useState<number>(18)
  const [includeWeekends, setIncludeWeekends] = useState<boolean>(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const wh = getWorkHours()
    setWorkStart(wh.start)
    setWorkEnd(wh.end)
    setIncludeWeekends(getPlannerWeekendsEnabled())
  }, [])

  function handleSave() {
    setWorkHours(workStart, workEnd, includeWeekends)
    setSaved(true)
    toast.success('Planner settings saved')
    window.dispatchEvent(new Event('storage'))
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[15px] font-[700] text-nb-charcoal font-nb-mono mb-1">
          Planner
        </h2>
        <p className="text-[12px] text-nb-muted font-nb-mono">
          Configure working hours and week structure for the planner.
        </p>
      </div>

      {/* Working hours */}
      <div className="bg-white border border-nb-cream-border rounded-[8px] p-5 flex flex-col gap-4">
        <div>
          <label className="text-[12px] font-[700] text-nb-charcoal font-nb-mono block mb-0.5">
            Work hours
          </label>
          <p className="text-[11px] text-nb-muted font-nb-mono">
            Daily time range used for task placement.
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
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
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
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-nb-muted font-nb-mono mt-5">
            ({workEnd - workStart}h per day)
          </div>
        </div>
      </div>

      {/* Weekends */}
      <div className="bg-white border border-nb-cream-border rounded-[8px] p-5 flex flex-col gap-3">
        <div>
          <label className="text-[12px] font-[700] text-nb-charcoal font-nb-mono block mb-0.5">
            Week structure
          </label>
          <p className="text-[11px] text-nb-muted font-nb-mono">
            By default the planner schedules Monday to Friday only. You can include Saturday and Sunday if needed.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeWeekends}
            onChange={e => setIncludeWeekends(e.target.checked)}
            className="h-3.5 w-3.5 rounded border border-nb-cream-border text-nb-green focus:ring-0"
          />
          <span className="text-[12px] text-nb-charcoal font-nb-mono">
            Include Saturday and Sunday in the planner
          </span>
        </label>
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

