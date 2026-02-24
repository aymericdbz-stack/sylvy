import { notFound } from 'next/navigation'
import { getAuthenticatedUser, getUserOrg } from '@/lib/auth-helpers'
import { getTemplate } from '@/lib/queries/templates'
import TemplateBuilder from '@/components/templates/TemplateBuilder'

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user } = await getAuthenticatedUser()
  const orgId = await getUserOrg(user.id)

  const template = await getTemplate(id, orgId)
  if (!template) notFound()

  return (
    <TemplateBuilder
      mode="edit"
      templateId={id}
      defaultTitle={template.title}
      defaultBlocks={template.blocks.map((b) => ({
        localId: b.id,
        type: b.type,
        content: b.content ?? '',
        order: b.order,
      }))}
      orgId={orgId}
      userId={user.id}
    />
  )
}
