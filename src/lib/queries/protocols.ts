import { createClient } from '@/lib/supabase/server'
import type { Protocol } from '@/lib/supabase/types'

export type ProtocolWithCounts = Protocol & {
  machine_count: number
  reagent_count: number
  owner_email: string | null
}

export type ProtocolDetail = Protocol & {
  machines: Array<{ id: string; name: string }>
  reagents: Array<{ id: string; name: string }>
}

export async function getProtocols(orgId: string): Promise<ProtocolWithCounts[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('protocols')
    .select(`
      *,
      owner:users!owner_id(email),
      protocol_machines(machine_id),
      protocol_reagents(reagent_id)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => ({
    ...row,
    owner_email: (row.owner as { email: string } | null)?.email ?? null,
    machine_count: Array.isArray(row.protocol_machines) ? row.protocol_machines.length : 0,
    reagent_count: Array.isArray(row.protocol_reagents) ? row.protocol_reagents.length : 0,
  }))
}

export async function getProtocol(id: string, orgId: string): Promise<ProtocolDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('protocols')
    .select(`
      *,
      protocol_machines(machine:machines(id, name)),
      protocol_reagents(reagent:reagents(id, name))
    `)
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error) return null

  return {
    ...data,
    machines: (data.protocol_machines ?? []).map(
      (pm: { machine: { id: string; name: string } | null }) => pm.machine
    ).filter(Boolean) as Array<{ id: string; name: string }>,
    reagents: (data.protocol_reagents ?? []).map(
      (pr: { reagent: { id: string; name: string } | null }) => pr.reagent
    ).filter(Boolean) as Array<{ id: string; name: string }>,
  }
}

export async function upsertProtocol(
  payload: {
    id?: string
    name: string
    timing?: string | null
    owner_id: string
    machine_ids: string[]
    reagent_ids: string[]
  },
  orgId: string
): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('protocols')
    .upsert({
      id: payload.id,
      name: payload.name,
      timing: payload.timing ?? null,
      owner_id: payload.owner_id,
      org_id: orgId,
    })
    .select('id')
    .single()

  if (error) throw error
  const protocolId = data.id

  // Replace junction rows atomically
  await supabase.from('protocol_machines').delete().eq('protocol_id', protocolId)
  await supabase.from('protocol_reagents').delete().eq('protocol_id', protocolId)

  if (payload.machine_ids.length > 0) {
    const { error: mErr } = await supabase.from('protocol_machines').insert(
      payload.machine_ids.map((machine_id) => ({ protocol_id: protocolId, machine_id }))
    )
    if (mErr) throw mErr
  }

  if (payload.reagent_ids.length > 0) {
    const { error: rErr } = await supabase.from('protocol_reagents').insert(
      payload.reagent_ids.map((reagent_id) => ({ protocol_id: protocolId, reagent_id }))
    )
    if (rErr) throw rErr
  }

  return protocolId
}

export async function deleteProtocol(id: string, orgId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('protocols').delete().eq('id', id).eq('org_id', orgId)
  if (error) throw error
}
