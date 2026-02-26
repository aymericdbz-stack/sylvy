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

export default async function NewExperimentPage({
  searchParams,
}: {
  searchParams: Promise<{ experiment_set_id?: string; project_id?: string }>
}) {
  const { orgId } = await getAuthContext()
  const options = await getOptions(orgId)
  const params = await searchParams
  const experimentSetId = params.experiment_set_id ?? null
  const projectId = params.project_id ?? null

  const backHref = experimentSetId && projectId
    ? `/notebook/${projectId}/${experimentSetId}`
    : '/notebook'

  return (
    <ExperimentForm
      mode="create"
      {...options}
      experimentSetId={experimentSetId}
      backHref={backHref}
    />
  )
}
