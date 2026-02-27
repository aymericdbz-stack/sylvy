'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Pencil, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/pl/Button'
import type { TaskTemplate, TaskTemplateInsert } from '../hooks/useTaskTemplates'
import type { StepData } from '../hooks/usePlannerTasks'

function uid() { return crypto.randomUUID() }

const TEMPLATE_COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#14B8A6', '#EF4444', '#4CAF7D']

const emptyStep = (): StepData => ({ id: uid(), name: '', duration: 30, startOffset: 0 })

// ── Step builder ──────────────────────────────────────────────────────────────
function StepBuilder({ steps, onChange }: { steps: StepData[]; onChange: (s: StepData[]) => void }) {
  function update(id: string, patch: Partial<StepData>) {
    onChange(steps.map(s => s.id === id ? { ...s, ...patch } : s))
  }
  function remove(id: string) {
    if (steps.length <= 1) return
    onChange(steps.filter(s => s.id !== id))
  }
  function add() {
    const last   = steps[steps.length - 1]
    const offset = last ? last.startOffset + last.duration : 0
    onChange([...steps, { id: uid(), name: '', duration: 30, startOffset: offset }])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">Steps</span>
        <button
          type="button"
          onClick={add}
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

          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[9px] text-pl-muted font-nb-mono">Duration (min)</label>
              <input
                type="number" min={1} value={step.duration}
                onChange={e => update(step.id, { duration: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full bg-pl-cream border border-pl-cream-border rounded-[5px] px-2.5 py-1.5 text-[11px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[9px] text-pl-muted font-nb-mono">Starts at T+</label>
              <input
                type="number" min={0} value={step.startOffset}
                onChange={e => update(step.id, { startOffset: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-pl-cream border border-pl-cream-border rounded-[5px] px-2.5 py-1.5 text-[11px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Template form (create / edit) ─────────────────────────────────────────────
interface FormProps {
  initial?: TaskTemplate | null
  onSave:  (data: TaskTemplateInsert) => Promise<void>
  onBack:  () => void
}

function TemplateForm({ initial, onSave, onBack }: FormProps) {
  const [name,   setName]   = useState(initial?.name  ?? '')
  const [color,  setColor]  = useState(initial?.color ?? TEMPLATE_COLORS[0])
  const [steps,  setSteps]  = useState<StepData[]>(
    initial && initial.steps.length > 0 ? initial.steps : [emptyStep()]
  )
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) { toast.error('Template name is required'); return }
    if (steps.some(s => !s.name.trim())) { toast.error('Every step must have a name'); return }
    if (steps.some(s => s.duration < 1)) { toast.error('Minimum duration: 1 min'); return }
    setSaving(true)
    try {
      await onSave({ name: name.trim(), color, steps })
      toast.success(initial ? 'Template updated' : 'Template created')
      onBack()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] text-pl-muted hover:text-pl-charcoal font-nb-mono transition-colors -mb-2"
        >
          ← Back
        </button>

        <div className="space-y-1.5">
          <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
            Template name *
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Western Blot 6 samples"
            autoFocus
            className="w-full bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono placeholder:text-pl-muted-light focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
            Color
          </label>
          <div className="flex gap-2 flex-wrap">
            {TEMPLATE_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  color === c ? 'border-pl-charcoal scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <StepBuilder steps={steps} onChange={setSteps} />
      </div>

      <div className="flex-shrink-0 px-5 py-4 border-t border-pl-cream-border">
        <Button variant="primary" size="md" className="w-full" onClick={handleSave} loading={saving}>
          {initial ? 'Update' : 'Save template'}
        </Button>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
interface TemplatesPanelProps {
  open:           boolean
  templates:      TaskTemplate[]
  onClose:        () => void
  onCreate:       (data: TaskTemplateInsert) => Promise<void>
  onUpdate:       (id: string, data: TaskTemplateInsert) => Promise<void>
  onDelete:       (id: string) => Promise<void>
}

export default function TemplatesPanel({
  open, templates, onClose, onCreate, onUpdate, onDelete,
}: TemplatesPanelProps) {
  const [view,       setView]       = useState<'list' | 'create' | 'edit'>('list')
  const [editTarget, setEditTarget] = useState<TaskTemplate | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)

  // Reset to list when panel closes
  useEffect(() => {
    if (!open) { setView('list'); setEditTarget(null) }
  }, [open])

  // Escape to close
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await onDelete(id)
      toast.success('Template deleted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />}

      <div
        className={`fixed right-0 top-0 h-full w-[420px] max-w-[90vw] bg-pl-cream z-50 shadow-2xl border-l border-pl-cream-border flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-pl-cream-border flex-shrink-0">
          <h2 className="text-[13px] font-[700] text-pl-charcoal font-nb-mono">Task templates</h2>
          <button onClick={onClose} className="p-1 text-pl-muted hover:text-pl-charcoal transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {view === 'list' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
              {templates.length === 0 && (
                <p className="text-[12px] text-pl-muted-light font-nb-mono text-center py-8">
                  No templates yet.
                </p>
              )}
              {templates.map(tpl => (
                <div
                  key={tpl.id}
                  className="flex items-center gap-3 bg-white border border-pl-cream-border rounded-[8px] px-3 py-2.5"
                >
                  {/* Color dot */}
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tpl.color ?? '#F97316' }}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-[600] text-pl-charcoal font-nb-mono truncate">{tpl.name}</p>
                    <p className="text-[10px] text-pl-muted-light font-nb-mono">
                      {tpl.steps.length} step{tpl.steps.length > 1 ? 's' : ''} —{' '}
                      {tpl.steps.reduce((a, s) => a + s.duration, 0)} min total
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditTarget(tpl); setView('edit') }}
                      className="p-1.5 text-pl-muted hover:text-pl-charcoal rounded-[4px] hover:bg-pl-cream-dark transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      disabled={deleting === tpl.id}
                      className="p-1.5 text-pl-muted-light hover:text-pl-error rounded-[4px] hover:bg-pl-cream-dark transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                    <ChevronRight size={13} className="text-pl-muted-light" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-shrink-0 px-5 py-4 border-t border-pl-cream-border">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => { setEditTarget(null); setView('create') }}
              >
                <Plus size={14} />
                New template
              </Button>
            </div>
          </div>
        )}

        {view === 'create' && (
          <TemplateForm
            initial={null}
            onSave={onCreate}
            onBack={() => setView('list')}
          />
        )}

        {view === 'edit' && editTarget && (
          <TemplateForm
            initial={editTarget}
            onSave={data => onUpdate(editTarget.id, data)}
            onBack={() => setView('list')}
          />
        )}
      </div>
    </>
  )
}
