import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTemplate } from '@/lib/queries/templates'
import TemplateBuilder from '@/components/templates/TemplateBuilder'

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user!.id).single()
  const orgId = userRow?.org_id ?? ''

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
      userId={user!.id}
    />
  )
}
