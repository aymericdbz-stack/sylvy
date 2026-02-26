import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/lib/queries/projects'
import { getExperimentSets } from '@/lib/queries/experiment-sets'
import Breadcrumb from '@/components/notebook/Breadcrumb'
import ExperimentSetListClient from '@/components/notebook/ExperimentSetListClient'

async function getData(projectId: string) {
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

  const experimentSets = await getExperimentSets(projectId, orgId)
  return { project, experimentSets }
}

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const data = await getData(projectId)
  if (!data) notFound()

  const { project, experimentSets } = data

  return (
    <div>
      <Breadcrumb
        segments={[
          { label: 'Lab Notebook', href: '/notebook' },
          { label: project.name, href: `/notebook/${project.id}` },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-[22px] font-[700] text-primary">{project.name}</h1>
        <p className="mt-1 text-[13px] text-nb-muted">
          Experiment section — experiments within this project, each containing their manipulations.
        </p>
      </div>

      <ExperimentSetListClient experimentSets={experimentSets} projectId={project.id} />
    </div>
  )
}
