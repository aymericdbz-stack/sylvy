import { createClient } from '@/lib/supabase/server'
import type { Sample, Machine, Reagent } from '@/lib/supabase/types'

// ─── Samples ──────────────────────────────────────────────────────────────────

export async function getSamples(orgId: string): Promise<(Sample & { owner_email: string | null })[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('samples')
    .select('*, owner:users!owner_id(email)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    owner_email: (row.owner as { email: string } | null)?.email ?? null,
  }))
}

export async function createSample(name: string, ownerId: string, orgId: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('samples')
    .insert({ name, owner_id: ownerId, org_id: orgId })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateSample(id: string, name: string, orgId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('samples').update({ name }).eq('id', id).eq('org_id', orgId)
  if (error) throw error
}

export async function deleteSample(id: string, orgId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('samples').delete().eq('id', id).eq('org_id', orgId)
  if (error) throw error
}

// ─── Machines ─────────────────────────────────────────────────────────────────

export async function getMachines(orgId: string): Promise<Machine[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createMachine(
  payload: { name: string; model?: string | null; status?: Machine['status'] },
  orgId: string
): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('machines')
    .insert({ ...payload, org_id: orgId })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateMachine(
  id: string,
  payload: { name?: string; model?: string | null; status?: Machine['status'] },
  orgId: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('machines').update(payload).eq('id', id).eq('org_id', orgId)
  if (error) throw error
}

export async function deleteMachine(id: string, orgId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('machines').delete().eq('id', id).eq('org_id', orgId)
  if (error) throw error
}

// ─── Reagents ─────────────────────────────────────────────────────────────────

export async function getReagents(orgId: string): Promise<Reagent[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reagents')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createReagent(
  payload: { name: string; supplier?: string | null; location?: string | null; expiration_date?: string | null },
  orgId: string
): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reagents')
    .insert({ ...payload, org_id: orgId })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateReagent(
  id: string,
  payload: { name?: string; supplier?: string | null; location?: string | null; expiration_date?: string | null },
  orgId: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('reagents').update(payload).eq('id', id).eq('org_id', orgId)
  if (error) throw error
}

export async function deleteReagent(id: string, orgId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('reagents').delete().eq('id', id).eq('org_id', orgId)
  if (error) throw error
}
