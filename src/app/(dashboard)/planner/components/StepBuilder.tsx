'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { StepData, FlexDir } from '../hooks/usePlannerTasks'

function uid() { return crypto.randomUUID() }

// ── T+ helpers ────────────────────────────────────────────────────────────────
function minsToHHMM(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
function hhmmToMins(val: string): number {
  const [hStr = '0', mStr = '0'] = val.split(':')
  const h = Math.max(0, parseInt(hStr, 10) || 0)
  const m = Math.min(59, Math.max(0, parseInt(mStr, 10) || 0))
  return h * 60 + m
}

// ── T+ offset input ────────────────────────────────────────────────────────────
export function TOffsetInput({ value, onChange, className }: {
  value: number; onChange: (v: number) => void; className?: string
}) {
  const [focused, setFocused] = useState(false)
  const [text,    setText]    = useState(minsToHHMM(value))
  return (
    <input
      type="text"
      value={focused ? text : minsToHHMM(value)}
      onChange={e => { setText(e.target.value); onChange(hhmmToMins(e.target.value)) }}
      onFocus={e => { setFocused(true); setText(minsToHHMM(value)); e.target.select() }}
      onBlur={() => setFocused(false)}
      placeholder="00:00"
      className={className}
    />
  )
}

// ── Step-type segment control ─────────────────────────────────────────────────
export function StepTypeToggle({
  stepType, availableType, onStepType, onAvailableType,
}: {
  stepType:        'busy' | 'available'
  availableType:   'strict' | 'flexible'
  onStepType:      (t: 'busy' | 'available') => void
  onAvailableType: (t: 'strict' | 'flexible') => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex bg-pl-cream rounded-[5px] border border-pl-cream-border p-0.5">
        {(['busy', 'available'] as const).map(t => (
          <button key={t} type="button" onClick={() => onStepType(t)}
            className={`px-2.5 py-1 rounded-[3px] text-[10px] font-[600] font-nb-mono transition-colors ${
              stepType === t ? 'bg-pl-charcoal text-white' : 'text-pl-muted hover:text-pl-charcoal'
            }`}
          >
            {t === 'busy' ? 'Busy' : 'Available'}
          </button>
        ))}
      </div>

      {stepType === 'available' && (
        <div className="flex bg-pl-cream rounded-[5px] border border-pl-cream-border p-0.5">
          {(['strict', 'flexible'] as const).map(t => (
            <button key={t} type="button" onClick={() => onAvailableType(t)}
              className={`px-2.5 py-1 rounded-[3px] text-[10px] font-[600] font-nb-mono transition-colors ${
                availableType === t ? 'bg-pl-orange text-white' : 'text-pl-muted hover:text-pl-charcoal'
              }`}
            >
              {t === 'strict' ? 'Strict' : 'Flexible'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Flex direction picker (shown only for flexible available steps) ────────────
const FLEX_DIR_LABELS: Record<FlexDir, string> = {
  '+':   '+ extend',
  '-':   '− compress',
  '+/-': '± both',
}

function FlexDirToggle({ value, onChange }: { value: FlexDir; onChange: (d: FlexDir) => void }) {
  return (
    <div className="flex bg-pl-cream rounded-[5px] border border-pl-cream-border p-0.5">
      {(['+', '-', '+/-'] as FlexDir[]).map(d => (
        <button key={d} type="button" onClick={() => onChange(d)}
          className={`px-2.5 py-1 rounded-[3px] text-[10px] font-[600] font-nb-mono transition-colors ${
            value === d ? 'bg-pl-orange text-white' : 'text-pl-muted hover:text-pl-charcoal'
          }`}
        >
          {FLEX_DIR_LABELS[d]}
        </button>
      ))}
    </div>
  )
}

// ── Empty step factory ────────────────────────────────────────────────────────
export function emptyStep(): StepData {
  return { id: uid(), name: '', description: '', duration: 30, startOffset: 0, stepType: 'busy', availableType: 'flexible' }
}

// ── Step builder ──────────────────────────────────────────────────────────────
export function StepBuilder({ steps, onChange }: { steps: StepData[]; onChange: (s: StepData[]) => void }) {
  const [notesOpen, setNotesOpen] = useState<Set<string>>(
    () => new Set(steps.filter(s => s.description).map(s => s.id))
  )

  function update(id: string, patch: Partial<StepData>) {
    onChange(steps.map(s => s.id === id ? { ...s, ...patch } : s))
  }
  function remove(id: string) {
    if (steps.length <= 1) return
    onChange(steps.filter(s => s.id !== id))
    setNotesOpen(prev => { const n = new Set(prev); n.delete(id); return n })
  }
  function add() {
    const last   = steps[steps.length - 1]
    const offset = last ? last.startOffset + last.duration : 0
    onChange([...steps, { ...emptyStep(), startOffset: offset }])
  }
  function toggleNotes(id: string) {
    setNotesOpen(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
          Steps
        </label>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-[10px] font-[600] text-pl-orange hover:text-pl-orange-dark font-nb-mono transition-colors"
        >
          <Plus size={12} /> Add step
        </button>
      </div>

      {steps.map((step, i) => (
        <div key={step.id} className="bg-white border border-pl-cream-border rounded-[8px] p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-[600] text-pl-muted font-nb-mono">Step {i + 1}</span>
            {steps.length > 1 && (
              <button onClick={() => remove(step.id)} className="p-0.5 text-pl-muted-light hover:text-pl-error transition-colors">
                <Trash2 size={12} />
              </button>
            )}
          </div>

          <input
            value={step.name}
            onChange={e => update(step.id, { name: e.target.value })}
            placeholder="Step name"
            className="w-full bg-pl-cream border border-pl-cream-border rounded-[5px] px-2.5 py-1.5 text-[11px] text-pl-charcoal font-nb-mono placeholder:text-pl-muted-light focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
          />

          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[9px] text-pl-muted font-nb-mono">
                {step.stepType === 'available' && step.availableType === 'flexible'
                  ? (step.flexibleDir === '-' ? 'Max duration (min)' : 'Min duration (min)')
                  : 'Duration (min)'}
              </label>
              <input type="number" min={1} value={step.duration}
                onChange={e => update(step.id, { duration: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full bg-pl-cream border border-pl-cream-border rounded-[5px] px-2.5 py-1.5 text-[11px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[9px] text-pl-muted font-nb-mono">Starts at T+ (hh:mm)</label>
              <TOffsetInput
                value={step.startOffset}
                onChange={v => update(step.id, { startOffset: v })}
                className="w-full bg-pl-cream border border-pl-cream-border rounded-[5px] px-2.5 py-1.5 text-[11px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
              />
            </div>
          </div>

          <StepTypeToggle
            stepType={step.stepType}
            availableType={step.availableType}
            onStepType={t => update(step.id, { stepType: t })}
            onAvailableType={t => update(step.id, { availableType: t })}
          />

          {step.stepType === 'available' && step.availableType === 'flexible' && (
            <div className="space-y-1.5">
              <FlexDirToggle
                value={step.flexibleDir ?? '+'}
                onChange={d => update(step.id, { flexibleDir: d })}
              />
              <div className="space-y-1">
                <label className="text-[9px] text-pl-muted font-nb-mono">
                  Max flexibility <span className="text-pl-muted-light">— blank = unlimited</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min={0} placeholder="0"
                    value={step.flexibleMax != null ? Math.floor(step.flexibleMax / 60) : ''}
                    onChange={e => {
                      const h   = Math.max(0, parseInt(e.target.value) || 0)
                      const min = step.flexibleMax != null ? step.flexibleMax % 60 : 0
                      const total = h * 60 + min
                      update(step.id, { flexibleMax: total === 0 ? undefined : total })
                    }}
                    className="w-14 bg-pl-cream border border-pl-cream-border rounded-[5px] px-2 py-1 text-[11px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
                  />
                  <span className="text-[10px] text-pl-muted font-nb-mono">h</span>
                  <input
                    type="number" min={0} max={59} placeholder="0"
                    value={step.flexibleMax != null ? step.flexibleMax % 60 : ''}
                    onChange={e => {
                      const min = Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
                      const h   = step.flexibleMax != null ? Math.floor(step.flexibleMax / 60) : 0
                      const total = h * 60 + min
                      update(step.id, { flexibleMax: total === 0 ? undefined : total })
                    }}
                    className="w-14 bg-pl-cream border border-pl-cream-border rounded-[5px] px-2 py-1 text-[11px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
                  />
                  <span className="text-[10px] text-pl-muted font-nb-mono">min</span>
                </div>
              </div>
            </div>
          )}

          {notesOpen.has(step.id) ? (
            <textarea
              autoFocus
              value={step.description}
              onChange={e => update(step.id, { description: e.target.value })}
              placeholder="Notes, reagents, conditions…"
              rows={2}
              className="w-full bg-pl-cream border border-pl-cream-border rounded-[5px] px-2.5 py-1.5 text-[11px] text-pl-charcoal font-nb-mono placeholder:text-pl-muted-light focus:outline-none focus:ring-1 focus:ring-pl-orange/40 resize-none"
            />
          ) : (
            <button type="button" onClick={() => toggleNotes(step.id)}
              className="flex items-center gap-1 text-[10px] text-pl-muted-light hover:text-pl-muted font-nb-mono transition-colors"
            >
              <Plus size={10} /> Add notes
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
