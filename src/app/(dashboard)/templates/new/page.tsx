import { createClient } from '@/lib/supabase/server'
import TemplateBuilder from '@/components/templates/TemplateBuilder'

export default async function NewTemplatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user!.id).single()
  const orgId = userRow?.org_id ?? ''

  return <TemplateBuilder mode="create" orgId={orgId} userId={user!.id} />
}
