import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExperimentForm from '@/components/experiments/ExperimentForm'

async function getOptions(orgId: string) {
  const supabase = await createClient()

  const [{ data: protocols }, { data: samples }, { data: templates }] = await Promise.all([
    supabase.from('protocols').select('id, name').eq('org_id', orgId).order('name'),
    supabase.from('samples').select('id, name').eq('org_id', orgId).order('name'),
    supabase.from('report_templates').select('id, title').eq('org_id', orgId).order('title'),
  ])

  return {
    protocols: (protocols ?? []).map((p) => ({ value: p.id, label: p.name })),
    samples: (samples ?? []).map((s) => ({ value: s.id, label: s.name })),
    templates: (templates ?? []).map((t) => ({ value: t.id, label: t.title })),
  }
}

export default async function NewExperimentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const orgId = userRow?.org_id ?? ''

  const options = await getOptions(orgId)

  return <ExperimentForm mode="create" {...options} />
}
