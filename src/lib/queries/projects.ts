import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/lib/supabase/types'

export type ProjectWithCounts = Project & {
  experiment_count: number
  manipulation_count: number
}

export async function getProjects(orgId: string): Promise<ProjectWithCounts[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*, experiment_sets(id, experiments:experiments(id))')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return []

  return (data ?? []).map((row) => {
    const sets = (row.experiment_sets ?? []) as { id: string; experiments: { id: string }[] }[]
    return {
      ...row,
      experiment_count: sets.length,
      manipulation_count: sets.reduce((sum, s) => sum + (s.experiments?.length ?? 0), 0),
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
