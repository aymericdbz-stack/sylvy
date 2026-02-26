import { getAuthenticatedUser, getUserOrg } from '@/lib/auth-helpers'
import ProtocolForm from '@/components/protocols/ProtocolForm'
import { getMachines, getReagents } from '@/lib/queries/resources'

export default async function NewProtocolPage() {
  const { user } = await getAuthenticatedUser()
  const orgId = await getUserOrg(user.id)

  const [machines, reagents] = await Promise.all([getMachines(orgId), getReagents(orgId)])

  return (
    <ProtocolForm
      mode="create"
      machines={machines}
      reagents={reagents}
      orgId={orgId}
      userId={user.id}
    />
  )
}
