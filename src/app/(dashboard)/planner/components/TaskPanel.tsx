'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/pl/Button'
import { StepBuilder, emptyStep } from './StepBuilder'

import type { PlannerTask, PlannerTaskInsert, StepData } from '../hooks/usePlannerTasks'
import type { TaskTemplate } from '../hooks/useTaskTemplates'
import { PLANNER_COLOR_PALETTE, pickDistinctPlannerColor } from '../utils/colors'

// ── Color picker ───────────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {PLANNER_COLOR_PALETTE.map(c => (
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

// ── Props ──────────────────────────────────────────────────────────────────────
interface TaskPanelProps {
  open:            boolean
  onClose:         () => void
  onUpdate?:       (id: string, data: PlannerTaskInsert) => Promise<void>
  onDelete?:       (id: string) => Promise<void>
  task?:           PlannerTask | null
  selectedStepId?: string | null
  templates:       TaskTemplate[]
  usedColors?:     string[]
}

// ── Main (edit-only) ────────────────────────────────────────────────────────────
export default function TaskPanel({
  open, onClose, onUpdate, onDelete,
  task, templates, usedColors = [],
}: TaskPanelProps) {
  const nameRef = useRef<HTMLInputElement>(null)

  const [name,         setName]         = useState('')
  const [steps,        setSteps]        = useState<StepData[]>([emptyStep()])
  const [color,        setColor]        = useState(PLANNER_COLOR_PALETTE[0] ?? '#F97316')
  const [applyTemplateId, setApplyTemplateId] = useState('')
  const [saving,         setSaving]         = useState(false)
  const [deleting,       setDeleting]       = useState(false)

  // Populate on open (edit mode only)
  useEffect(() => {
    if (!open || !task) return
    setName(task.name)
    setSteps(task.steps.length > 0 ? task.steps : [emptyStep()])
    setColor(task.color ?? pickDistinctPlannerColor(usedColors, PLANNER_COLOR_PALETTE[0] ?? null))
    setApplyTemplateId('')
    setTimeout(() => nameRef.current?.focus(), 100)
  }, [open, task, usedColors])

  // Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Don't render if no task (edit-only)
  if (!task) return null

  function validate() {
    if (!name.trim())                       { toast.error('Name is required');          return false }
    if (steps.some(s => !s.name.trim()))    { toast.error('Every step needs a name');  return false }
    if (steps.some(s => s.duration < 1))   { toast.error('Minimum duration: 1 min');  return false }
    return true
  }

  async function handleUpdate() {
    if (!validate() || !task || !onUpdate) return
    setSaving(true)
    try {
      await onUpdate(task.id, {
        name:            name.trim(),
        description:     task.description,
        priority:        task.priority,
        placement:       task.placement,
        deadline:        task.deadline,
        steps,
        color,
        scheduled_start: task.scheduled_start,
      })
      toast.success('Template updated')
      onClose()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!task || !onDelete) return
    setDeleting(true)
    try {
      await onDelete(task.id)
      toast.success('Template deleted')
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
            Edit template
          </h2>
          <button onClick={onClose} className="p-1 text-pl-muted hover:text-pl-charcoal transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
              Name *
            </label>
            <input
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Western Blot"
              className="w-full bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono placeholder:text-pl-muted-light focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
            />
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
              Color
            </label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          {/* Sync from template */}
          {templates.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
                Sync from template
              </label>
              <div className="flex gap-2">
                <select
                  value={applyTemplateId}
                  onChange={e => setApplyTemplateId(e.target.value)}
                  className="flex-1 bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
                >
                  <option value="">— Apply a template —</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!applyTemplateId}
                  onClick={() => {
                    const tpl = templates.find(t => t.id === applyTemplateId)
                    if (!tpl) return
                    const tplSteps = tpl.steps.length > 0
                      ? tpl.steps.map(s => ({ ...s, id: crypto.randomUUID() }))
                      : [emptyStep()]
                    setSteps(tplSteps)
                    setColor(pickDistinctPlannerColor(usedColors, tpl.color ?? null))
                    setName(tpl.name)
                    setApplyTemplateId('')
                    toast.success(`Steps replaced with template "${tpl.name}"`)
                  }}
                  className="px-3 py-2 rounded-[6px] text-[11px] font-[600] font-nb-mono bg-pl-orange/10 text-pl-orange hover:bg-pl-orange/20 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  Apply
                </button>
              </div>
              <p className="text-[10px] text-pl-muted font-nb-mono">
                Replaces this template&apos;s steps with the selected workflow. Save to keep.
              </p>
            </div>
          )}

          {/* Step builder */}
          <StepBuilder steps={steps} onChange={setSteps} />

        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-pl-cream-border">
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
        </div>

      </div>
    </>
  )
}
