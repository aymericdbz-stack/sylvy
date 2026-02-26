'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/pl/Button'
import type { PlannerTaskInsert, StepData } from '../hooks/usePlannerTasks'

function uid() { return crypto.randomUUID() }

interface TaskPanelProps {
  open: boolean
  onClose: () => void
  onSave: (data: PlannerTaskInsert) => Promise<void>
}

const emptyStep = (): StepData => ({ id: uid(), name: '', duration: 30, startOffset: 0 })

export default function TaskPanel({ open, onClose, onSave }: TaskPanelProps) {
  const [name,     setName]     = useState('')
  const [deadline, setDeadline] = useState('')
  const [steps,    setSteps]    = useState<StepData[]>([emptyStep()])
  const [saving,   setSaving]   = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setName('')
      setDeadline('')
      setSteps([emptyStep()])
      setTimeout(() => nameRef.current?.focus(), 100)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  function updateStep(id: string, patch: Partial<StepData>) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  function removeStep(id: string) {
    if (steps.length <= 1) return
    setSteps(prev => prev.filter(s => s.id !== id))
  }

  function addStep() {
    // default T+ = end of last step
    const last = steps[steps.length - 1]
    const offset = last ? last.startOffset + last.duration : 0
    setSteps(prev => [...prev, { id: uid(), name: '', duration: 30, startOffset: offset }])
  }

  async function handleSave() {
    if (!name.trim()) { toast.error('Nom de tâche requis'); return }
    if (steps.some(s => !s.name.trim())) { toast.error('Chaque étape doit avoir un nom'); return }
    if (steps.some(s => s.duration < 1)) { toast.error('Durée minimum : 1 min'); return }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        deadline: deadline ? new Date(deadline).toISOString() : null,
        steps,
      })
      toast.success('Tâche créée')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed right-0 top-0 h-full w-[400px] max-w-[90vw] bg-pl-cream z-50 shadow-2xl border-l border-pl-cream-border flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-pl-cream-border flex-shrink-0">
          <h2 className="text-[13px] font-[700] text-pl-charcoal font-nb-mono">Nouvelle tâche</h2>
          <button onClick={onClose} className="p-1 text-pl-muted hover:text-pl-charcoal transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Task name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
              Nom de la tâche *
            </label>
            <input
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Western Blot"
              className="w-full bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono placeholder:text-pl-muted-light focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
            />
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
              Deadline (optionnel)
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
            />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-[600] text-pl-muted uppercase tracking-[0.06em] font-nb-mono">
                Étapes
              </label>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-1 text-[10px] font-[600] text-pl-orange hover:text-pl-orange-dark font-nb-mono transition-colors"
              >
                <Plus size={12} /> Ajouter
              </button>
            </div>

            {steps.map((step, i) => (
              <div
                key={step.id}
                className="bg-white border border-pl-cream-border rounded-[8px] p-3 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-[600] text-pl-muted font-nb-mono">
                    Étape {i + 1}
                  </span>
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStep(step.id)}
                      className="p-0.5 text-pl-muted-light hover:text-pl-error transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                {/* Step name */}
                <input
                  value={step.name}
                  onChange={e => updateStep(step.id, { name: e.target.value })}
                  placeholder="Nom de l'étape"
                  className="w-full bg-pl-cream border border-pl-cream-border rounded-[5px] px-2.5 py-1.5 text-[11px] text-pl-charcoal font-nb-mono placeholder:text-pl-muted-light focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
                />

                <div className="flex gap-2">
                  {/* Duration */}
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-pl-muted font-nb-mono">Durée (min)</label>
                    <input
                      type="number"
                      min={1}
                      value={step.duration}
                      onChange={e => updateStep(step.id, { duration: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full bg-pl-cream border border-pl-cream-border rounded-[5px] px-2.5 py-1.5 text-[11px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
                    />
                  </div>

                  {/* T+ offset */}
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-pl-muted font-nb-mono">Starts at T+</label>
                    <input
                      type="number"
                      min={0}
                      value={step.startOffset}
                      onChange={e => updateStep(step.id, { startOffset: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-pl-cream border border-pl-cream-border rounded-[5px] px-2.5 py-1.5 text-[11px] text-pl-charcoal font-nb-mono focus:outline-none focus:ring-1 focus:ring-pl-orange/40"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-pl-cream-border">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleSave}
            disabled={saving}
            loading={saving}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </>
  )
}
