'use server'

import { createClient } from '@/lib/supabase/server'

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userRow } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!userRow) throw new Error('User not found')
  return { supabase, userId: user.id, orgId: userRow.org_id }
}

export async function createProjectAction(name: string) {
  const { supabase, userId, orgId } = await getAuthContext()
  const { error } = await supabase
    .from('projects')
    .insert({ name, owner_id: userId, org_id: orgId })
  if (error) throw error
}

export async function createExperimentSetAction(name: string, projectId: string) {
  const { supabase, userId, orgId } = await getAuthContext()
  const { error } = await supabase
    .from('experiment_sets')
    .insert({ name, project_id: projectId, owner_id: userId, org_id: orgId })
  if (error) throw error
}
