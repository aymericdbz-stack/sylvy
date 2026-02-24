import { createClient } from '@/lib/supabase/server'
import ProtocolForm from '@/components/protocols/ProtocolForm'
import { getMachines, getReagents } from '@/lib/queries/resources'

export default async function NewProtocolPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user!.id).single()
  const orgId = userRow?.org_id ?? ''

  const [machines, reagents] = await Promise.all([getMachines(orgId), getReagents(orgId)])

  return (
    <ProtocolForm
      mode="create"
      machines={machines}
      reagents={reagents}
      orgId={orgId}
      userId={user!.id}
    />
  )
}
