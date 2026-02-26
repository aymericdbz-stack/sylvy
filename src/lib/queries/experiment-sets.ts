import { createClient } from '@/lib/supabase/server'
import type { ExperimentSet } from '@/lib/supabase/types'

export type ExperimentSetWithCount = ExperimentSet & {
  manipulation_count: number
}

export async function getExperimentSets(projectId: string, orgId: string): Promise<ExperimentSetWithCount[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('experiment_sets')
    .select('*, experiments:experiments(id)')
    .eq('project_id', projectId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return []

  return (data ?? []).map((row) => {
    const experiments = (row.experiments ?? []) as { id: string }[]
    return {
      ...row,
      manipulation_count: experiments.length,
    }
  })
}

export async function getExperimentSet(id: string, orgId: string): Promise<ExperimentSet | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('experiment_sets')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error) return null
  return data
}

export async function createExperimentSet(
  payload: { name: string; project_id: string; owner_id: string },
  orgId: string
): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('experiment_sets')
    .insert({ ...payload, org_id: orgId })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateExperimentSet(
  id: string,
  payload: { name?: string },
  orgId: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('experiment_sets')
    .update(payload)
    .eq('id', id)
    .eq('org_id', orgId)
  if (error) throw error
}

export async function deleteExperimentSet(id: string, orgId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('experiment_sets').delete().eq('id', id).eq('org_id', orgId)
  if (error) throw error
}
