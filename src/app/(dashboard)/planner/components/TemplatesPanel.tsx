'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Pencil, ChevronRight, Save } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/pl/Button'
import type { TaskTemplate, TaskTemplateInsert } from '../hooks/useTaskTemplates'
import type { StepData } from '../hooks/usePlannerTasks'
import { StepBuilder, emptyStep } from './StepBuilder'

function uid() { return crypto.randomUUID() }

const TEMPLATE_COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#14B8A6', '#EF4444', '#4CAF7D']

// ── Standard template definitions ─────────────────────────────────────────────
const STANDARD_DEFS = [
  {
    name: 'Western Blot',
    color: '#3B82F6',
    steps: [
      { name: 'Cell lysis (add lysis buffer, vortex)',               duration: 10,  startOffset: 0   },
      { name: 'Lysis incubation on ice',                             duration: 10,  startOffset: 10  },
      { name: 'Protein quantification (BCA / Bradford)',              duration: 25,  startOffset: 20  },
      { name: 'Laemmli sample prep & denaturation (95°C, 5 min)',    duration: 10,  startOffset: 45  },
      { name: 'Load gel & set up SDS-PAGE',                          duration: 10,  startOffset: 55  },
      { name: 'SDS-PAGE migration',                                  duration: 60,  startOffset: 65  },
      { name: 'Activate PVDF membrane (methanol)',                   duration: 10,  startOffset: 125 },
      { name: 'Assemble transfer sandwich & run wet transfer',       duration: 75,  startOffset: 135 },
      { name: 'Block membrane (5% milk / BSA, RT)',                  duration: 45,  startOffset: 210 },
      { name: 'Add primary antibody',                                duration:  5,  startOffset: 255 },
      { name: 'Primary antibody incubation (RT, 2h)',                duration: 120, startOffset: 260 },
      { name: 'Wash × 3 (TBST, 10 min each)',                       duration: 30,  startOffset: 380 },
      { name: 'Add secondary antibody',                              duration:  5,  startOffset: 410 },
      { name: 'Secondary antibody incubation (RT, 1h)',              duration: 60,  startOffset: 415 },
      { name: 'Wash × 3 (TBST, 10 min each)',                       duration: 30,  startOffset: 475 },
      { name: 'ECL substrate & image acquisition',                   duration: 20,  startOffset: 505 },
    ],
  },
  {
    name: 'Sandwich ELISA',
    color: '#14B8A6',
    steps: [
      { name: 'Coat plate with capture antibody',                    duration: 20,  startOffset: 0    },
      {
        name:           'Overnight coating incubation (4°C)',
        duration:       720,
        startOffset:    20,
        stepType:       'available' as const,
        availableType:  'flexible' as const,
        overnight:      true,
      },
      { name: 'Wash × 3 (PBS-T)',                                    duration: 10,  startOffset: 740  },
      { name: 'Add blocking solution (1% BSA / 5% milk)',            duration: 10,  startOffset: 750  },
      { name: 'Blocking incubation (RT, 1h)',                        duration: 60,  startOffset: 760  },
      { name: 'Prepare standards & distribute samples',              duration: 25,  startOffset: 820  },
      { name: 'Sample incubation (RT, 2h)',                          duration: 120, startOffset: 845  },
      { name: 'Wash × 5 (PBS-T)',                                    duration: 15,  startOffset: 965  },
      { name: 'Add detection antibody',                              duration: 10,  startOffset: 980  },
      { name: 'Detection antibody incubation (RT, 1h)',              duration: 60,  startOffset: 990  },
      { name: 'Wash × 5 (PBS-T)',                                    duration: 15,  startOffset: 1050 },
      { name: 'Add streptavidin-HRP conjugate',                      duration: 10,  startOffset: 1065 },
      { name: 'Conjugate incubation (RT, 30 min)',                   duration: 30,  startOffset: 1075 },
      { name: 'Critical wash × 7 (PBS-T)',                          duration: 20,  startOffset: 1105 },
      { name: 'Add TMB substrate',                                   duration:  5,  startOffset: 1125 },
      { name: 'Color development monitoring',                        duration: 10,  startOffset: 1130 },
      { name: 'Stop reaction & read absorbance (450 nm)',            duration: 10,  startOffset: 1140 },
    ],
  },
  {
    name: 'PCR (endpoint)',
    color: '#8B5CF6',
    steps: [
      { name: 'Prepare PCR master mix',                              duration: 10, startOffset: 0   },
      { name: 'Distribute mix & samples (seal plates)',              duration: 10, startOffset: 10  },
      { name: 'Initial denaturation (95°C, 3 min)',                  duration:  3, startOffset: 20  },
      { name: '30 cycles: denature / anneal / extend (95/60/72°C)', duration: 60, startOffset: 23  },
      { name: 'Final extension (72°C, 5 min)',                       duration:  5, startOffset: 83  },
      { name: 'Hold at 4°C',                                         duration: 10, startOffset: 88  },
      { name: 'Prepare agarose gel (1-2%)',                          duration: 15, startOffset: 98  },
      { name: 'Load samples & run gel',                              duration: 45, startOffset: 113 },
      { name: 'Gel imaging & analysis',                              duration: 10, startOffset: 158 },
    ],
  },
]

function makeStandardTemplates(): TaskTemplateInsert[] {
  return STANDARD_DEFS.map(def => ({
    name:  def.name,
    color: def.color,
    steps: def.steps.map(s => ({
      ...s,
      id:            uid(),
      description:   '',
      stepType:      (s as any).stepType ?? ('busy' as const),
      availableType: (s as any).availableType ?? ('flexible' as const),
      overnight:     (s as any).overnight ?? false,
    })),
  }))
}

// ── Template form (create / edit) ─────────────────────────────────────────────
interface FormProps {
  initial?: TaskTemplate | null
  onSave:  (data: TaskTemplateInsert) => Promise<void>
  onBack:  () => void
  onDelete?: () => Promise<void> | void
}

function TemplateForm({ initial, onSave, onBack, onDelete }: FormProps) {
  const [name,   setName]   = useState(initial?.name  ?? '')
  const [color,  setColor]  = useState(initial?.color ?? TEMPLATE_COLORS[0])
  const [steps,  setSteps]  = useState<StepData[]>(
    initial && initial.steps.length > 0 ? initial.steps : [emptyStep()]
  )
  const [saving, setSaving] = useState(false)

  // Sync form when opening a different template for edit (or when initial loads)
  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setColor(initial.color ?? TEMPLATE_COLORS[0])
      setSteps(initial.steps.length > 0 ? initial.steps : [emptyStep()])
    } else {
      setName('')
      setColor(TEMPLATE_COLORS[0])
      setSteps([emptyStep()])
    }
  }, [initial?.id])

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
    <div className="flex flex-col h-full min-h-0">
      {/* Sticky header with Back + Save so Save is always visible */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-b border-pl-cream-border bg-pl-cream">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] text-pl-muted hover:text-pl-charcoal font-nb-mono transition-colors"
        >
          ← Back
        </button>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          <Save size={14} className="mr-1.5" />
          {initial ? 'Save workflow' : 'Save template'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 min-h-0">

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
      <div className="flex-shrink-0 px-5 py-4 border-t border-pl-cream-border bg-pl-cream">
        {initial && onDelete ? (
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="md"
              onClick={onDelete}
            >
              <Trash2 size={14} className="mr-2" />
              Delete template
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={handleSave}
              loading={saving}
            >
              <Save size={14} className="mr-2" />
              Save changes
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleSave}
            loading={saving}
          >
            <Save size={14} className="mr-2" />
            Save template
          </Button>
        )}
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
  const [seeding,    setSeeding]    = useState(false)
  const seededRef = useRef(false)

  async function handleSeedStandard() {
    const toCreate = makeStandardTemplates().filter(
      tpl => !templates.some(t => t.name === tpl.name)
    )
    if (toCreate.length === 0) {
      toast.info('Standard templates already loaded')
      return
    }
    setSeeding(true)
    try {
      for (const tpl of toCreate) await onCreate(tpl)
      toast.success(`${toCreate.length} standard template${toCreate.length > 1 ? 's' : ''} loaded`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setSeeding(false)
    }
  }

  // Reset to list when panel closes
  useEffect(() => {
    if (!open) { setView('list'); setEditTarget(null) }
  }, [open])

  // Auto-seed any missing standard templates on first open
  useEffect(() => {
    if (!open || seededRef.current) return
    const toCreate = makeStandardTemplates().filter(
      tpl => !templates.some(t => t.name === tpl.name)
    )
    if (toCreate.length === 0) return
    seededRef.current = true
    setSeeding(true)
    ;(async () => {
      try {
        for (const tpl of toCreate) await onCreate(tpl)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error')
      } finally {
        setSeeding(false)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templates.length])

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
          <h2 className="text-[13px] font-[700] text-pl-charcoal font-nb-mono">Workflow templates</h2>
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
                  className="flex items-center gap-3 bg-white border border-pl-cream-border rounded-[8px] px-3 py-2.5 cursor-pointer hover:bg-pl-cream-dark/60 transition-colors"
                  onClick={() => { setEditTarget(tpl); setView('edit') }}
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
                      onClick={e => { e.stopPropagation(); setEditTarget(tpl); setView('edit') }}
                      className="p-1.5 text-pl-muted hover:text-pl-charcoal rounded-[4px] hover:bg-pl-cream-dark transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(tpl.id) }}
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

            <div className="flex-shrink-0 px-5 py-4 border-t border-pl-cream-border space-y-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => { setEditTarget(null); setView('create') }}
              >
                <Plus size={14} />
                New template
              </Button>
              <button
                type="button"
                onClick={handleSeedStandard}
                disabled={seeding}
                className="w-full text-[10px] font-nb-mono text-pl-muted hover:text-pl-charcoal transition-colors disabled:opacity-40 py-1"
              >
                {seeding ? 'Loading...' : '↓ Load standard templates'}
              </button>
            </div>
          </div>
        )}

        {view === 'create' && (
          <div className="flex-1 flex flex-col min-h-0">
            <TemplateForm
              initial={null}
              onSave={onCreate}
              onBack={() => setView('list')}
            />
          </div>
        )}

        {view === 'edit' && editTarget && (
          <div className="flex-1 flex flex-col min-h-0">
            <TemplateForm
              initial={editTarget}
              onSave={data => onUpdate(editTarget.id, data)}
              onBack={() => setView('list')}
              onDelete={async () => {
                await handleDelete(editTarget.id)
                setView('list')
              }}
            />
          </div>
        )}
      </div>
    </>
  )
}
