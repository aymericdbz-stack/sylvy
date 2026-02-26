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
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    // If there is no visible report for this experiment (RLS, no rows, etc.),
    // signal absence to the caller so the UI can handle it gracefully.
    return null
  }

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
  type ReportBlockInsert = {
    report_id: string
    template_block_id: string | null
    type: 'heading' | 'text' | 'image_placeholder' | 'data_table'
    order: number
    content: string | null
  }
  const reportBlocks: ReportBlockInsert[] = []
  if (blocks && blocks.length > 0) {
    reportBlocks.push(
      ...blocks.map((b) => ({
        report_id: report.id,
        template_block_id: b.id,
        type: b.type as 'heading' | 'text' | 'image_placeholder' | 'data_table',
        order: b.order,
        content: b.type === 'heading' ? b.content : null,
      }))
    )
  }

  // Ensure Results and Comments sections exist
  const hasResults = blocks?.some((b) => b.type === 'heading' && /result/i.test(b.content || ''))
  const hasComments = blocks?.some((b) => b.type === 'heading' && /comment/i.test(b.content || ''))

  const maxOrder = reportBlocks.length > 0 ? Math.max(...reportBlocks.map((b) => b.order)) : 0

  if (!hasResults) {
    reportBlocks.push({
      report_id: report.id,
      template_block_id: null,
      type: 'heading',
      order: maxOrder + 1,
      content: 'Results',
    })
    reportBlocks.push({
      report_id: report.id,
      template_block_id: null,
      type: 'text',
      order: maxOrder + 2,
      content: null,
    })
  }

  if (!hasComments) {
    const nextOrder = Math.max(...reportBlocks.map((b) => b.order)) + 1
    reportBlocks.push({
      report_id: report.id,
      template_block_id: null,
      type: 'heading',
      order: nextOrder,
      content: 'Comments',
    })
    reportBlocks.push({
      report_id: report.id,
      template_block_id: null,
      type: 'text',
      order: nextOrder + 1,
      content: null,
    })
  }

  // Insert all blocks
  if (reportBlocks.length > 0) {
    const { error: rbErr } = await supabase.from('report_blocks').insert(reportBlocks)
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
