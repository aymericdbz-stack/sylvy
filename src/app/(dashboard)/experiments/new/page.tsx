import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth-helpers'
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
  const { orgId } = await getAuthContext()
  const options = await getOptions(orgId)
  return <ExperimentForm mode="create" {...options} />
}
