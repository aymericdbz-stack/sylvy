'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/nb/Input'
import Select from '@/components/ui/nb/Select'
import Button from '@/components/ui/nb/Button'

interface Option { value: string; label: string }

interface ExperimentPresentationEditorProps {
  experimentId: string
  initial: {
    name: string
    project: string | null
    protocol_id: string | null
    protocol_name: string | null
    sample_id: string | null
    sample_name: string | null
    report_template_id: string | null
    template_title: string | null
    owner_email: string | null
    created_at: string
  }
  protocols: Option[]
  samples: Option[]
  templates: Option[]
  createdAtLabel: string
}

export default function ExperimentPresentationEditor({
  experimentId,
  initial,
  protocols,
  samples,
  templates,
  createdAtLabel,
}: ExperimentPresentationEditorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialForm = useMemo(() => ({
    name: initial.name ?? '',
    project: initial.project ?? '',
    protocol_id: initial.protocol_id ?? '',
    sample_id: initial.sample_id ?? '',
    report_template_id: initial.report_template_id ?? '',
  }), [initial])

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(initialForm.name)
  const [project, setProject] = useState(initialForm.project)
  const [protocolId, setProtocolId] = useState(initialForm.protocol_id)
  const [sampleId, setSampleId] = useState(initialForm.sample_id)
  const [templateId, setTemplateId] = useState(initialForm.report_template_id)

  useEffect(() => {
    const edit = searchParams.get('edit')
    if (edit === 'presentation') setEditing(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reset = useCallback(() => {
    setName(initialForm.name)
    setProject(initialForm.project)
    setProtocolId(initialForm.protocol_id)
    setSampleId(initialForm.sample_id)
    setTemplateId(initialForm.report_template_id)
  }, [initialForm])

  const onCancel = useCallback(() => {
    reset()
    setEditing(false)
  }, [reset])

  const onSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error('Experiment name is required')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('experiments')
      .update({
        name: name.trim(),
        project: project.trim() ? project.trim() : null,
        protocol_id: protocolId || null,
        sample_id: sampleId || null,
        report_template_id: templateId || null,
        last_edited_at: new Date().toISOString(),
      })
      .eq('id', experimentId)

    if (error) {
      toast.error('Failed to update presentation')
      setSaving(false)
      return
    }

    toast.success('Presentation updated')
    setSaving(false)
    setEditing(false)
    router.refresh()
  }, [experimentId, name, project, protocolId, sampleId, templateId, router])

  return (
    <div className="bg-white border border-nb-cream-border rounded-[8px] p-5 font-nb-mono">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[13px] font-[700] text-nb-muted uppercase tracking-[0.06em] mb-4">Presentation</h2>
        {!editing ? (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={onSave} loading={saving}>
              Save
            </Button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="flex flex-col gap-4">
          {[
            { label: 'Experiment name', value: initial.name ?? '—' },
            { label: 'Project', value: initial.project ?? '—' },
            { label: 'Protocol', value: initial.protocol_name ?? '—' },
            { label: 'Sample', value: initial.sample_name ?? '—' },
            { label: 'Template', value: initial.template_title ?? '—' },
            { label: 'Created by', value: initial.owner_email ?? '—' },
            { label: 'Created at', value: createdAtLabel },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-[600] text-nb-muted uppercase tracking-[0.04em] mb-0.5">{label}</p>
              <p className="text-[13px] text-nb-charcoal">{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-[560px]">
          <Input
            label="Experiment Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Western Blot — Sample A — Run 3"
          />

          <Input
            label="Project"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="e.g. CRISPR Screen Q2"
          />

          <Select
            label="Protocol"
            placeholder="Select a protocol..."
            options={protocols}
            value={protocolId || undefined}
            onChange={(v) => setProtocolId(v || '')}
          />

          <Select
            label="Sample"
            placeholder="Select a sample..."
            options={samples}
            value={sampleId || undefined}
            onChange={(v) => setSampleId(v || '')}
          />

          <Select
            label="Report Template"
            placeholder="Select a template..."
            options={templates}
            value={templateId || undefined}
            onChange={(v) => setTemplateId(v || '')}
          />

          <div className="flex flex-col gap-4 pt-1">
            <div>
              <p className="text-[10px] font-[600] text-nb-muted uppercase tracking-[0.04em] mb-0.5">Created by</p>
              <p className="text-[13px] text-nb-charcoal">{initial.owner_email ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-[600] text-nb-muted uppercase tracking-[0.04em] mb-0.5">Created at</p>
              <p className="text-[13px] text-nb-charcoal">{createdAtLabel}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

