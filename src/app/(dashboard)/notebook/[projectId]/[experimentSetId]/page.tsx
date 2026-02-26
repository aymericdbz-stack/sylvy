import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/lib/queries/projects'
import { getExperimentSet } from '@/lib/queries/experiment-sets'
import { formatDateGroupKey } from '@/lib/utils'
import Breadcrumb from '@/components/notebook/Breadcrumb'
import DateGroup from '@/components/notebook/DateGroup'
import Button from '@/components/ui/nb/Button'

async function getData(projectId: string, experimentSetId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userRow } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!userRow) return null
  const orgId = userRow.org_id

  const project = await getProject(projectId, orgId)
  if (!project) return null

  const experimentSet = await getExperimentSet(experimentSetId, orgId)
  if (!experimentSet || experimentSet.project_id !== projectId) return null

  // Fetch manipulations (experiments) for this experiment set
  const { data } = await supabase
    .from('experiments')
    .select(`
      *,
      owner:users!experiments_owner_id_fkey(email),
      protocol:protocols!experiments_protocol_id_fkey(name),
      sample:samples!experiments_sample_id_fkey(name),
      reports(id),
      experiment_files(id)
    `)
    .eq('experiment_set_id', experimentSetId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  const manipulations = (data ?? []).map((row) => ({
    ...row,
    owner_email: (row.owner as { email: string } | null)?.email ?? null,
    protocol_name: (row.protocol as { name: string } | null)?.name ?? null,
    sample_name: (row.sample as { name: string } | null)?.name ?? null,
    has_report: Array.isArray(row.reports) && row.reports.length > 0,
    file_count: Array.isArray(row.experiment_files) ? row.experiment_files.length : 0,
  }))

  return { project, experimentSet, manipulations }
}

export default async function ExperimentSetPage({
  params,
}: {
  params: Promise<{ projectId: string; experimentSetId: string }>
}) {
  const { projectId, experimentSetId } = await params
  const data = await getData(projectId, experimentSetId)
  if (!data) notFound()

  const { project, experimentSet, manipulations } = data

  // Group manipulations by date
  const groups = new Map<string, typeof manipulations>()
  for (const m of manipulations) {
    const key = formatDateGroupKey(m.created_at)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(m)
  }

  return (
    <div>
      <Breadcrumb
        segments={[
          { label: 'Lab Notebook', href: '/notebook' },
          { label: project.name, href: `/notebook/${project.id}` },
          { label: experimentSet.name, href: `/notebook/${project.id}/${experimentSet.id}` },
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-[700] text-nb-charcoal">{experimentSet.name}</h1>
          <p className="mt-1 text-[13px] text-nb-muted">
            Manipulation section — individual runs and measurements inside this experiment.
          </p>
        </div>
        <Link href={`/experiments/new?experiment_set_id=${experimentSet.id}&project_id=${project.id}`}>
          <Button variant="primary">
            <Plus size={14} strokeWidth={1.5} />
            New Manipulation
          </Button>
        </Link>
      </div>

      {manipulations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-nb-cream-dark flex items-center justify-center mb-4">
            <span className="text-[24px]">🧫</span>
          </div>
          <p className="text-[15px] font-[600] text-nb-charcoal mb-1">No manipulations yet</p>
          <p className="text-[13px] text-nb-muted mb-6">Start logging your first manipulation in this experiment.</p>
          <Link href={`/experiments/new?experiment_set_id=${experimentSet.id}&project_id=${project.id}`}>
            <Button variant="primary">Start your first manipulation</Button>
          </Link>
        </div>
      ) : (
        <div>
          {Array.from(groups.entries()).map(([date, manips], i) => (
            <div key={date}>
              {i > 0 && <div className="border-t border-nb-cream-border mb-8" />}
              <DateGroup date={date} experiments={manips} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
