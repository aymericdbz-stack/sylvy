import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/lib/supabase/types'
import type { ExperimentSetWithCount } from './experiment-sets'

export type ProjectWithCounts = Project & {
  experiment_count: number
  manipulation_count: number
  experiment_sets: ExperimentSetWithCount[]
}

export async function getProjects(orgId: string): Promise<ProjectWithCounts[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      experiment_sets (
        id,
        name,
        created_at,
        experiments:experiments (
          id,
          name,
          created_at
        )
      )
    `
    )
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return []

  return (data ?? []).map((row) => {
    const sets = (row.experiment_sets ?? []) as {
      id: string
      name: string
      created_at: string
      experiments: { id: string; name: string; created_at: string }[]
    }[]

    const setsWithCounts: ExperimentSetWithCount[] = sets.map((set) => {
      const experiments = set.experiments ?? []
      const manipulations = experiments.map((exp) => ({
        id: exp.id,
        name: exp.name,
        created_at: exp.created_at,
      }))

      return {
        id: set.id,
        name: set.name,
        created_at: set.created_at,
        org_id: row.org_id,
        owner_id: row.owner_id,
        project_id: row.id,
        manipulation_count: manipulations.length,
        manipulations,
      }
    })

    return {
      ...row,
      experiment_sets: setsWithCounts,
      experiment_count: setsWithCounts.length,
      manipulation_count: setsWithCounts.reduce((sum, s) => sum + s.manipulation_count, 0),
    }
  })
}

export async function getProject(id: string, orgId: string): Promise<Project | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error) return null
  return data
}

export async function createProject(
  payload: { name: string; description?: string | null; owner_id: string },
  orgId: string
): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...payload, org_id: orgId })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateProject(
  id: string,
  payload: { name?: string; description?: string | null },
  orgId: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)
    .eq('org_id', orgId)
  if (error) throw error
}

export async function deleteProject(id: string, orgId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id).eq('org_id', orgId)
  if (error) throw error
}
