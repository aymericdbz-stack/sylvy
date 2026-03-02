'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Button from '@/components/ui/pl/Button'
import type { PlannerTask, PlannerTaskInsert, StepData } from '../hooks/usePlannerTasks'
import type { TaskTemplate } from '../hooks/useTaskTemplates'
import { getTimezone } from '@/lib/preferences'
import { utcToTzDatetime, tzDatetimeToUTC } from '../utils/timezone'

function uid() { return crypto.randomUUID() }

const STEP_COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#14B8A6', '#EF4444', '#4CAF7D']

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

// ── T+ offset input (hh:mm) ───────────────────────────────────────────────────
function TOffsetInput({ value, onChange, className }: { value: number; onChange: (v: number) => void; className?: string }) {
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState(minsToHHMM(value))
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

interface TaskPanelProps {
  open:       boolean
  onClose:    () => void
  onSave:     (data: PlannerTaskInsert) => Promise<void>
  onUpdate?:  (id: string, data: PlannerTaskInsert) => Promise<void>
  onDelete?:  (id: string) => Promise<void>
  task?:      PlannerTask | null
  templates:  TaskTemplate[]
}

const emptyStep = (): StepData => ({ id: uid(), name: '', description: '', duration: 30, startOffset: 0 })

// ── Step builder ──────────────────────────────────────────────────────────────
function StepBuilder({ steps, onChange }: { steps: StepData[]; onChange: (steps: StepData[]) => void }) {
  // Track which steps have their notes textarea expanded.
  // Pre-expand steps that already have content.
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
    const last = steps[steps.length - 1]
    const offset = last ? last.startOffset + last.duration : 0
    onChange([...steps, { id: uid(), name: '', description: '', duration: 30, startOffset: offset }])
  }
  function toggleNotes(id: string) {
    setNotesOpen(prev => {
      const n = new Set(prev)
      if (n.has(id)) { n.delete(id) } else { n.add(id) }
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
          <Plus size={12} /> Add
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
            <button
              type="button"
              onClick={() => toggleNotes(step.id)}
              className="flex items-center gap-1 text-[10px] text-pl-muted-light hover:text-pl-muted font-nb-mono transition-colors"
            >
              <Plus size={10} />
              Add notes
            </button>
          )}
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[9px] text-pl-muted font-nb-mono">Duration (min)</label>
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
        </div>
      ))}
    </div>
  )
}

// ── Color picker ──────────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {STEP_COLORS.map(c => (
        <button key={c} type="button" onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border-2 transition-transform ${
            value === c ? 'border-pl-charcoal scale-110' : 'border-transparent hover:scale-105'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

// ── Toggle chip ───────────────────────────────────────────────────────────────
function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-[600] font-nb-mono border transition-colors ${
        active
          ? 'bg-pl-charcoal text-white border-pl-charcoal'
          : 'bg-white border-pl-cream-border text-pl-muted hover:text-pl-charcoal'
      }`}
    >
      <span className={`w-3 h-3 rounded-[3px] border flex items-center justify-center flex-shrink-0 transition-colors ${
        active ? 'bg-white/20 border-white/40' : 'border-pl-cream-border'
      }`}>
        {active && <span className="block w-1.5 h-1.5 rounded-[1px] bg-white" />}
      </span>
      {label}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TaskPanel({ open, onClose, onSave, onUpdate, onDelete, task, templates }: TaskPanelProps) {
  const router  = useRouter()
  const isEdit  = !!task
  const nameRef = useRef<HTMLInputElement>(null)

  const [name,           setName]           = useState('')
  const [description,    setDescription]    = useState('')
  const [startDate,      setStartDate]      = useState('')   // YYYY-MM-DD
  const [startTime,      setStartTime]      = useState('')   // HH:MM
  const [steps,          setSteps]          = useState<StepData[]>([emptyStep()])
  const [singleDuration, setSingleDuration] = useState(30)
  const [color,          setColor]          = useState(STEP_COLORS[0])
  const [useTemplate,    setUseTemplate]    = useState(false)
  const [selectedTpl,    setSelectedTpl]    = useState<string>('')
  const [multiSteps,     setMultiSteps]     = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [deleting,       setDeleting]       = useState(false)

  // Populate form when opening
  useEffect(() => {
    if (!open) return
    if (task) {
      setName(task.name)
      setDescription(task.description ?? '')
      if (task.scheduled_start) {
        const { date, time } = utcToTzDatetime(task.scheduled_start, getTimezone())
        setStartDate(date)
        setStartTime(time)
      } else {
        setStartDate('')
        setStartTime('')
      }
      const hasMultiSteps = task.steps.length > 1
      setMultiSteps(hasMultiSteps)
      setSteps(task.steps.length > 0 ? task.steps : [emptyStep()])
      setSingleDuration(task.steps.length > 0
        ? task.steps.reduce((a, s) => a + s.duration, 0)
        : 30)
      setColor(task.color ?? STEP_COLORS[0])
      setUseTemplate(false)
      setSelectedTpl('')
    } else {
      setName('')
      setDescription('')
      setStartDate('')
      setStartTime('')
      setSteps([emptyStep()])
      setSingleDuration(30)
      setColor(STEP_COLORS[0])
      setUseTemplate(false)
      setSelectedTpl('')
      setMultiSteps(false)
    }
    setTimeout(() => nameRef.current?.focus(), 100)
  }, [open, task])

  // Load template
  useEffect(() => {
    if (!selectedTpl) return
    const tpl = templates.find(t => t.id === selectedTpl)
    if (!tpl) return
    const tplSteps = tpl.steps.length > 0 ? tpl.steps.map(s => ({ ...s, id: uid() })) : [emptyStep()]
    setSteps(tplSteps)
    setSingleDuration(tplSteps.reduce((a, s) => a + s.duration, 0))
    setColor(tpl.color ?? STEP_COLORS[0])
    if (tplSteps.length > 1) setMultiSteps(true)
  }, [selectedTpl, templates])

  // Toggle multi-steps: preserve durations
  function handleToggleMultiSteps() {
    if (!multiSteps) {
      // switching to multi: keep current step or create one with singleDuration
      if (steps.length === 0) {
        setSteps([{ id: uid(), name: '', description: '', duration: singleDuration, startOffset: 0 }])
      } else {
        setSteps(steps.map((s, i) => i === 0 ? { ...s, duration: singleDuration } : s))
      }
    } else {
      // switching to single: sum durations
      setSingleDuration(steps.reduce((a, s) => a + s.duration, 0))
    }
    setMultiSteps(v => !v)
  }

  // Escape to close
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  async function handleSave() {
    if (!name.trim()) { toast.error('Task name is required'); return }

    const stepsToSave: StepData[] = multiSteps
      ? steps
      : [{ id: uid(), name: name.trim(), description: '', duration: singleDuration, startOffset: 0 }]

    if (multiSteps && stepsToSave.some(s => !s.name.trim())) {
      toast.error('Every step must have a name'); return
    }
    if (stepsToSave.some(s => s.duration < 1)) {
      toast.error('Minimum duration: 1 min'); return
    }

    const tz        = getTimezone()
    const hasStart  = startDate && startTime
    const placement = hasStart ? 'manual' : 'auto'

    const data: PlannerTaskInsert = {
      name:        name.trim(),
      description: description.trim() || null,
      placement,
      deadline: null,
      steps:    stepsToSave,
      color,
      scheduled_start: hasStart
        ? tzDatetimeToUTC(startDate, startTime, tz)
        : isEdit && placement === 'auto' && task?.scheduled_start
          ? task.scheduled_start
          : null,
    }

    setSaving(true)
    try {
      if (isEdit && onUpdate && task) {
        await onUpdate(task.id, data)
        toast.success('Task updated')
      } else {
        await onSave(data)
        toast.success('Task created')
      }
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!task || !onDelete) return
    setDeleting(true)
    try {
      await onDelete(task.id)
      toast.success('Task deleted')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />}

      <div className={`fixed right-0 top-0 h-full w-[400px] max-w-[90vw] bg-pl-cream z-50 shadow-2xl border-l border-pl-cream-border flex flex-col transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-pl-cream-border flex-shrink-0">
          <h2 className="text-[13px] font-[700] text-pl-charcoal font-nb-mono">
            {isEdit ? 'Edit task' : 'New task'}
          </h2>
          <button onClick={onClose} className="p-1 text-pl-muted hover:text-pl-charcoal transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Task name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
              Task name *
            </label>
            <input
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Western Blot"
              className="w-full bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono placeholder:text-pl-muted-light focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
              Description <span className="text-pl-muted-light font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add notes, protocol references, reagent details…"
              rows={3}
              className="w-full bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono placeholder:text-pl-muted-light focus:outline-none focus:ring-1 focus:ring-pl-orange/40 resize-none"
            />
          </div>

          {/* Start date + time */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
              Start <span className="text-pl-muted-light font-normal normal-case">(optional — leave blank for auto-scheduling)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="flex-1 bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
              />
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-[110px] bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
              />
            </div>
          </div>

          {/* Toggles row */}
          <div className="flex gap-2">
            {!isEdit && (
              <ToggleChip
                label="From a template"
                active={useTemplate}
                onClick={() => { setUseTemplate(v => !v); if (useTemplate) setSelectedTpl('') }}
              />
            )}
            <ToggleChip
              label="Multi-steps"
              active={multiSteps}
              onClick={handleToggleMultiSteps}
            />
          </div>

          {/* Template selector */}
          {!isEdit && useTemplate && (
            <div className="space-y-1.5">
              <select
                value={selectedTpl}
                onChange={e => {
                  if (e.target.value === '__new__') {
                    router.push('/templates/new')
                    return
                  }
                  setSelectedTpl(e.target.value)
                }}
                className="w-full bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
              >
                <option value="">— Select a template —</option>
                <option value="__new__">+ Create new template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Duration (simple mode) or Steps (multi-steps mode) */}
          {multiSteps ? (
            <StepBuilder steps={steps} onChange={setSteps} />
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
                Duration (min)
              </label>
              <input
                type="number"
                min={1}
                value={singleDuration}
                onChange={e => setSingleDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
              />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-pl-cream-border flex items-center gap-3">
          {isEdit && onDelete && (
            <Button variant="danger" size="md" onClick={handleDelete} loading={deleting}>
              <Trash2 size={13} />
              Delete
            </Button>
          )}
          <Button variant="primary" size="md" className="flex-1" onClick={handleSave} loading={saving}>
            {isEdit ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>
    </>
  )
}
