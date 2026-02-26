import { getAuthenticatedUser, getUserOrg } from '@/lib/auth-helpers'
import TemplateBuilder from '@/components/templates/TemplateBuilder'

export default async function NewTemplatePage() {
  const { user } = await getAuthenticatedUser()
  const orgId = await getUserOrg(user.id)

  return <TemplateBuilder mode="create" orgId={orgId} userId={user.id} />
}
