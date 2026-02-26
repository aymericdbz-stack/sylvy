import { createClient } from '@/lib/supabase/server'
import type { ReportTemplate, TemplateBlock } from '@/lib/supabase/types'

export type TemplateWithCount = ReportTemplate & {
  block_count: number
  owner_email: string | null
}

export type TemplateDetail = ReportTemplate & {
  blocks: TemplateBlock[]
}

export async function getTemplates(orgId: string): Promise<TemplateWithCount[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('report_templates')
    .select('*, owner:users!owner_id(email), template_blocks(id)')
    .eq('org_id', orgId)
    .order('title', { ascending: true })
  if (error) throw error

  return (data ?? []).map((row) => ({
    ...row,
    owner_email: (row.owner as { email: string } | null)?.email ?? null,
    block_count: Array.isArray(row.template_blocks) ? row.template_blocks.length : 0,
  }))
}

export async function getTemplate(id: string, orgId: string): Promise<TemplateDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('report_templates')
    .select('*, template_blocks(*)')
    .eq('id', id)
    .eq('org_id', orgId)
    .order('order', { referencedTable: 'template_blocks', ascending: true })
    .single()
  if (error) return null

  return {
    ...data,
    blocks: ((data.template_blocks ?? []) as TemplateBlock[]).sort((a, b) => a.order - b.order),
  }
}

export async function upsertTemplate(
  payload: {
    id?: string
    title: string
    owner_id: string
    blocks: Array<{ id?: string; type: TemplateBlock['type']; content: string | null; order: number }>
  },
  orgId: string
): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('report_templates')
    .upsert({ id: payload.id, title: payload.title, owner_id: payload.owner_id, org_id: orgId })
    .select('id')
    .single()
  if (error) throw error
  const templateId = data.id

  // Replace all blocks
  await supabase.from('template_blocks').delete().eq('template_id', templateId)

  if (payload.blocks.length > 0) {
    const { error: bErr } = await supabase.from('template_blocks').insert(
      payload.blocks.map((b) => ({
        template_id: templateId,
        type: b.type,
        content: b.content,
        order: b.order,
      }))
    )
    if (bErr) throw bErr
  }

  return templateId
}

export async function deleteTemplate(id: string, orgId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('report_templates').delete().eq('id', id).eq('org_id', orgId)
  if (error) throw error
}
