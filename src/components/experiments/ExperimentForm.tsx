'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/nb/Button'
import Input from '@/components/ui/nb/Input'
import Select from '@/components/ui/nb/Select'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  project: z.string().max(200).optional().nullable(),
  protocol_id: z.string().uuid().optional().nullable(),
  sample_id: z.string().uuid().optional().nullable(),
  report_template_id: z.string().uuid().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface Option { value: string; label: string }

interface ExperimentFormProps {
  mode: 'create' | 'edit'
  experimentId?: string
  defaultValues?: Partial<FormData>
  protocols: Option[]
  samples: Option[]
  templates: Option[]
}

export default function ExperimentForm({
  mode, experimentId, defaultValues, protocols, samples, templates,
}: ExperimentFormProps) {
  const router = useRouter()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {},
  })

  const protocolId = watch('protocol_id')
  const sampleId = watch('sample_id')
  const templateId = watch('report_template_id')

  const onSubmit = async (data: FormData) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (mode === 'create') {
      const { data: exp, error } = await supabase
        .from('experiments')
        .insert({
          name: data.name,
          project: data.project ?? null,
          protocol_id: data.protocol_id ?? null,
          sample_id: data.sample_id ?? null,
          report_template_id: data.report_template_id ?? null,
          owner_id: user.id,
          org_id: (await supabase.from('users').select('org_id').eq('id', user.id).single()).data?.org_id ?? '',
        })
        .select('id')
        .single()

      if (error) { toast.error('Failed to create experiment'); return }
      router.push(`/experiments/${exp.id}`)
    } else {
      const { error } = await supabase
        .from('experiments')
        .update({
          name: data.name,
          project: data.project ?? null,
          protocol_id: data.protocol_id ?? null,
          sample_id: data.sample_id ?? null,
          report_template_id: data.report_template_id ?? null,
          last_edited_at: new Date().toISOString(),
        })
        .eq('id', experimentId!)

      if (error) { toast.error('Failed to update experiment'); return }
      toast.success('Experiment updated')
      router.refresh()
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={experimentId ? `/experiments/${experimentId}` : '/notebook'}>
          <button className="flex items-center gap-1.5 text-[13px] text-nb-muted hover:text-nb-charcoal transition-colors mb-4">
            <ArrowLeft size={14} strokeWidth={1.5} />
            {experimentId ? 'Back to experiment' : 'Notebook'}
          </button>
        </Link>
        <h1 className="text-[22px] font-[700] text-nb-charcoal">
          {mode === 'create' ? 'New Experiment' : 'Edit Experiment'}
        </h1>
      </div>

      <div className="bg-white border border-nb-cream-border rounded-[8px] p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-[560px]">
          <Input
            label="Experiment Name *"
            placeholder="e.g. Western Blot — Sample A — Run 3"
            {...register('name')}
            error={!!errors.name}
            errorMessage={errors.name?.message}
          />

          <Input
            label="Project"
            placeholder="e.g. CRISPR Screen Q2"
            {...register('project')}
          />

          <Select
            label="Protocol"
            placeholder="Select a protocol..."
            options={protocols}
            value={protocolId ?? undefined}
            onChange={(v) => setValue('protocol_id', v || null)}
          />
          {protocols.length === 0 && (
            <p className="text-[11px] text-nb-muted-light -mt-2">
              No protocols yet —{' '}
              <Link href="/protocols/new" className="text-nb-green hover:underline">create one first</Link>
            </p>
          )}

          <Select
            label="Sample"
            placeholder="Select a sample..."
            options={samples}
            value={sampleId ?? undefined}
            onChange={(v) => setValue('sample_id', v || null)}
          />
          {samples.length === 0 && (
            <p className="text-[11px] text-nb-muted-light -mt-2">
              No samples yet —{' '}
              <Link href="/resources" className="text-nb-green hover:underline">create one first</Link>
            </p>
          )}

          <Select
            label="Report Template"
            placeholder="Select a template..."
            options={templates}
            value={templateId ?? undefined}
            onChange={(v) => setValue('report_template_id', v || null)}
          />
          {templates.length === 0 && (
            <p className="text-[11px] text-nb-muted-light -mt-2">
              No templates yet —{' '}
              <Link href="/templates/new" className="text-nb-green hover:underline">create one first</Link>
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-nb-cream-border">
            <Link href={experimentId ? `/experiments/${experimentId}` : '/notebook'}>
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {mode === 'create' ? 'Create experiment' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
