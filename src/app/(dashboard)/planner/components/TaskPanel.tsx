'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Trash2, Hand, Clock, Save } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/pl/Button'
import { StepBuilder, emptyStep, TOffsetInput as _TOffsetInput } from './StepBuilder'

function uid() { return crypto.randomUUID() }
import type { PlannerTask, PlannerTaskInsert, StepData, Priority } from '../hooks/usePlannerTasks'
import type { TaskTemplate, TaskTemplateInsert } from '../hooks/useTaskTemplates'
import { getTimezone } from '@/lib/preferences'
import { tzDatetimeToUTC } from '../utils/timezone'

const STEP_COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#14B8A6', '#EF4444', '#4CAF7D']

// ── Color picker ───────────────────────────────────────────────────────────────
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

// ── Priority picker ────────────────────────────────────────────────────────────
const PRIO_STYLES: Record<Priority, string> = {
  critical: 'data-[active=true]:bg-red-500 data-[active=true]:text-white data-[active=true]:border-red-500',
  normal:   'data-[active=true]:bg-pl-charcoal data-[active=true]:text-white data-[active=true]:border-pl-charcoal',
  low:      'data-[active=true]:bg-pl-muted data-[active=true]:text-white data-[active=true]:border-pl-muted',
}

function PriorityPicker({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  return (
    <div className="flex gap-1.5">
      {(['critical', 'normal', 'low'] as Priority[]).map(p => (
        <button key={p} type="button" onClick={() => onChange(p)}
          data-active={value === p}
          className={`flex-1 py-1.5 rounded-[6px] text-[11px] font-[600] font-nb-mono border border-pl-cream-border bg-white text-pl-muted transition-colors capitalize hover:text-pl-charcoal ${PRIO_STYLES[p]}`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface TaskPanelProps {
  open:            boolean
  onClose:         () => void
  onSave:          (data: PlannerTaskInsert) => Promise<string>
  onSaveTemplate?: (data: TaskTemplateInsert) => Promise<void>
  onUpdate?:       (id: string, data: PlannerTaskInsert) => Promise<void>
  onDelete?:       (id: string) => Promise<void>
  onManualPlace?:  (taskId: string) => void
  task?:           PlannerTask | null
  selectedStepId?: string | null
  templates:       TaskTemplate[]
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function TaskPanel({
  open, onClose, onSave, onUpdate, onDelete,
  onManualPlace,
  task, templates,
}: TaskPanelProps) {
  const isEdit  = !!task
  const nameRef = useRef<HTMLInputElement>(null)

  const [activeTab,    setActiveTab]    = useState<'oneoff' | 'template'>('template')
  const [name,         setName]         = useState('')
  const [description,  setDescription]  = useState('')
  const [priority,     setPriority]     = useState<Priority>('normal')
  const [deadline,     setDeadline]     = useState('')
  const [steps,        setSteps]        = useState<StepData[]>([emptyStep()])
  const [color,        setColor]        = useState(STEP_COLORS[0])
  const [selectedTpl,  setSelectedTpl]  = useState('')
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState(false)

  // Populate on open
  useEffect(() => {
    if (!open) return
    if (task) {
      setName(task.name)
      setDescription(task.description ?? '')
      setPriority(task.priority ?? 'normal')
      setDeadline(task.deadline ? task.deadline.slice(0, 10) : '')
      setSteps(task.steps.length > 0 ? task.steps : [emptyStep()])
      setColor(task.color ?? STEP_COLORS[0])
      setSelectedTpl('')
      setActiveTab('oneoff')
    } else {
      setName('')
      setDescription('')
      setPriority('normal')
      setDeadline('')
      setSteps([emptyStep()])
      setColor(STEP_COLORS[0])
      setSelectedTpl('')
      setActiveTab('template')
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
    setColor(tpl.color ?? STEP_COLORS[0])
    if (!name) setName(tpl.name)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTpl, templates])

  // Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  function validate() {
    if (!name.trim())                       { toast.error('Task name is required');    return false }
    if (steps.some(s => !s.name.trim()))    { toast.error('Every step needs a name'); return false }
    if (steps.some(s => s.duration < 1))   { toast.error('Minimum duration: 1 min'); return false }
    return true
  }

  function buildPayload(placement: 'manual' | 'auto', scheduled_start?: string | null): PlannerTaskInsert {
    const tz = getTimezone()
    return {
      name:            name.trim(),
      description:     description.trim() || null,
      priority,
      placement,
      deadline:        deadline ? tzDatetimeToUTC(deadline, '23:59', tz) : null,
      steps,
      color,
      scheduled_start: scheduled_start ?? null,
    }
  }

  async function handleManualPlace() {
    if (!validate()) return
    setSaving(true)
    try {
      const id = await onSave(buildPayload('manual'))
      toast.success('Click the calendar to set the start time')
      onClose()
      onManualPlace?.(id)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function handleUpdate() {
    if (!validate() || !task || !onUpdate) return
    const tz = getTimezone()
    setSaving(true)
    try {
      await onUpdate(task.id, {
        name:            name.trim(),
        description:     description.trim() || null,
        priority,
        placement:       task.placement,
        deadline:        deadline ? tzDatetimeToUTC(deadline, '23:59', tz) : null,
        steps,
        color,
        scheduled_start: task.scheduled_start,
      })
      toast.success('Task updated')
      onClose()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!task || !onDelete) return
    setDeleting(true)
    try {
      await onDelete(task.id)
      toast.success('Task deleted')
      onClose()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Error') }
    finally { setDeleting(false) }
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />}

      <div className={`fixed right-0 top-0 h-full w-[420px] max-w-[90vw] bg-pl-cream z-50 shadow-2xl border-l border-pl-cream-border flex flex-col transition-transform duration-300 ease-in-out ${
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

        {/* Tab bar (create only) */}
        {!isEdit && (
          <div className="flex px-5 pt-3 gap-1 flex-shrink-0">
            {([['oneoff', 'One-off'], ['template', 'From template']] as const).map(([tab, label]) => (
              <button key={tab} type="button"
                onClick={() => { setActiveTab(tab); setSelectedTpl('') }}
                className={`flex-1 py-1.5 rounded-[6px] text-[11px] font-[600] font-nb-mono border transition-colors ${
                  activeTab === tab
                    ? 'bg-white border-pl-cream-border text-pl-charcoal shadow-sm'
                    : 'border-transparent text-pl-muted hover:text-pl-charcoal'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Template selector */}
          {!isEdit && activeTab === 'template' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
                Template
              </label>
              <select
                value={selectedTpl}
                onChange={e => setSelectedTpl(e.target.value)}
                className="w-full bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
              >
                <option value="">— Select a template —</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          {/* Priority (edit only) */}
          {isEdit && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
                Priority
              </label>
              <PriorityPicker value={priority} onChange={setPriority} />
            </div>
          )}

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

          {/* Deadline / description / color – keep only for edits */}
          {isEdit && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
                  Deadline <span className="text-pl-muted-light font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
                  Description <span className="text-pl-muted-light font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Notes, reagents, conditions…"
                  rows={2}
                  className="w-full bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono placeholder:text-pl-muted-light focus:outline-none focus:ring-1 focus:ring-pl-orange/40 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
                  Color
                </label>
                <ColorPicker value={color} onChange={setColor} />
              </div>
            </>
          )}

          {/* Edit: placement badge */}
          {isEdit && task && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-pl-cream-border rounded-[6px]">
              {task.placement === 'manual'
                ? <Hand size={13} className="text-pl-muted flex-shrink-0" />
                : <Sparkles size={13} className="text-pl-orange flex-shrink-0" />}
              <span className="text-[11px] text-pl-muted font-nb-mono">
                {task.placement === 'manual' ? 'Manually placed' : 'Auto-scheduled'}
              </span>
              {task.scheduled_start && (
                <>
                  <Clock size={12} className="text-pl-muted-light flex-shrink-0 ml-1" />
                  <span className="text-[11px] text-pl-muted-light font-nb-mono">
                    {new Date(task.scheduled_start).toLocaleString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Step builder */}
          <StepBuilder steps={steps} onChange={setSteps} />

        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-pl-cream-border">
          {isEdit ? (
            <div className="flex items-center gap-2">
              {onDelete && (
                <Button variant="danger" size="md" onClick={handleDelete} loading={deleting}>
                  <Trash2 size={13} /> Delete
                </Button>
              )}
              <Button variant="primary" size="md" className="flex-1" onClick={handleUpdate} loading={saving}>
                <Save size={13} className="mr-2" />
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="md" className="flex-1" onClick={handleManualPlace} loading={saving}>
                <Hand size={13} /> Place manually
              </Button>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
