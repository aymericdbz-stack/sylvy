import { createClient } from '@/lib/supabase/server'
import type { Report, ReportBlock } from '@/lib/supabase/types'

export type ReportDetail = Report & {
  blocks: ReportBlock[]
}

export async function getReport(experimentId: string, orgId: string): Promise<ReportDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reports')
    .select('*, report_blocks(*)')
    .eq('experiment_id', experimentId)
    .single()

  if (error) return null

  return {
    ...data,
    blocks: ((data.report_blocks ?? []) as ReportBlock[]).sort((a, b) => a.order - b.order),
  }
}

export async function createReport(
  experimentId: string,
  templateId: string,
  userId: string,
  orgId: string
): Promise<string> {
  const supabase = await createClient()

  // Create report record
  const { data: report, error: rErr } = await supabase
    .from('reports')
    .insert({ experiment_id: experimentId, template_id: templateId, created_by: userId })
    .select('id')
    .single()
  if (rErr) throw rErr

  // Fetch template blocks
  const { data: blocks, error: bErr } = await supabase
    .from('template_blocks')
    .select('*')
    .eq('template_id', templateId)
    .order('order', { ascending: true })
  if (bErr) throw bErr

  // Create one ReportBlock per TemplateBlock
  if (blocks && blocks.length > 0) {
    const { error: rbErr } = await supabase.from('report_blocks').insert(
      blocks.map((b) => ({
        report_id: report.id,
        template_block_id: b.id,
        type: b.type,
        order: b.order,
        content: b.type === 'heading' ? b.content : null,
      }))
    )
    if (rbErr) throw rbErr
  }

  return report.id
}

export async function updateReportBlocks(
  blocks: Array<{ id: string; content?: string | null; storage_url?: string | null }>
): Promise<void> {
  const supabase = await createClient()

  await Promise.all(
    blocks.map((b) =>
      supabase
        .from('report_blocks')
        .update({ content: b.content, storage_url: b.storage_url })
        .eq('id', b.id)
    )
  )
}
