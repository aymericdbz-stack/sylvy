import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getExperiment } from '@/lib/queries/experiments'
import ExperimentForm from '@/components/experiments/ExperimentForm'

export default async function EditExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user!.id).single()
  const orgId = userRow?.org_id ?? ''

  const experiment = await getExperiment(id, orgId)
  if (!experiment) notFound()

  const [{ data: protocols }, { data: samples }, { data: templates }] = await Promise.all([
    supabase.from('protocols').select('id, name').eq('org_id', orgId).order('name'),
    supabase.from('samples').select('id, name').eq('org_id', orgId).order('name'),
    supabase.from('report_templates').select('id, title').eq('org_id', orgId).order('title'),
  ])

  return (
    <ExperimentForm
      mode="edit"
      experimentId={id}
      defaultValues={{
        name: experiment.name,
        project: experiment.project,
        protocol_id: experiment.protocol_id,
        sample_id: experiment.sample_id,
        report_template_id: experiment.report_template_id,
      }}
      protocols={(protocols ?? []).map((p) => ({ value: p.id, label: p.name }))}
      samples={(samples ?? []).map((s) => ({ value: s.id, label: s.name }))}
      templates={(templates ?? []).map((t) => ({ value: t.id, label: t.title }))}
    />
  )
}
