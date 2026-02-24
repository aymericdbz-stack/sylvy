import { notFound } from 'next/navigation'
import { getAuthenticatedUser, getUserOrg } from '@/lib/auth-helpers'
import { getProtocol } from '@/lib/queries/protocols'
import { getMachines, getReagents } from '@/lib/queries/resources'
import ProtocolForm from '@/components/protocols/ProtocolForm'

export default async function EditProtocolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user } = await getAuthenticatedUser()
  const orgId = await getUserOrg(user.id)

  const [protocol, machines, reagents] = await Promise.all([
    getProtocol(id, orgId),
    getMachines(orgId),
    getReagents(orgId),
  ])

  if (!protocol) notFound()

  return (
    <ProtocolForm
      mode="edit"
      protocolId={id}
      defaultValues={{
        name: protocol.name,
        timing: protocol.timing,
        machine_ids: protocol.machines.map((m) => m.id),
        reagent_ids: protocol.reagents.map((r) => r.id),
      }}
      machines={machines}
      reagents={reagents}
      orgId={orgId}
      userId={user.id}
    />
  )
}
