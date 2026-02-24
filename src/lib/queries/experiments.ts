import { createClient } from '@/lib/supabase/server'
import type { Experiment, ExperimentFile } from '@/lib/supabase/types'

export type ExperimentWithMeta = Experiment & {
  owner_email: string | null
  protocol_name: string | null
  sample_name: string | null
  has_report: boolean
}

export async function getExperiments(orgId: string): Promise<ExperimentWithMeta[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('experiments')
    .select('*, owner:users!experiments_owner_id_fkey(email), protocol:protocols!experiments_protocol_id_fkey(name), sample:samples!experiments_sample_id_fkey(name), reports(id)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => {
    const owner = row.owner as { email: string } | null
    const protocol = row.protocol as { name: string } | null
    const sample = row.sample as { name: string } | null
    const reports = row.reports as { id: string }[] | null
    return {
      ...row,
      owner_email: owner?.email ?? null,
      protocol_name: protocol?.name ?? null,
      sample_name: sample?.name ?? null,
      has_report: Array.isArray(reports) && reports.length > 0,
    }
  })
}

export type ExperimentDetail = ExperimentWithMeta & {
  files: ExperimentFile[]
  report_id: string | null
  template_title: string | null
}

export async function getExperiment(id: string, orgId: string): Promise<ExperimentDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('experiments')
    .select('*, owner:users!experiments_owner_id_fkey(email), protocol:protocols!experiments_protocol_id_fkey(name), sample:samples!experiments_sample_id_fkey(name), template:report_templates!experiments_report_template_id_fkey(title), reports(id), experiment_files(*)')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error) return null

  const owner = data.owner as { email: string } | null
  const protocol = data.protocol as { name: string } | null
  const sample = data.sample as { name: string } | null
  const template = data.template as { title: string } | null
  const reports = data.reports as { id: string }[] | null
  const files = data.experiment_files as ExperimentFile[] | null

  return {
    ...data,
    owner_email: owner?.email ?? null,
    protocol_name: protocol?.name ?? null,
    sample_name: sample?.name ?? null,
    template_title: template?.title ?? null,
    has_report: Array.isArray(reports) && reports.length > 0,
    report_id: Array.isArray(reports) && reports.length > 0 ? reports[0].id : null,
    files: files ?? [],
  }
}

export async function createExperiment(
  payload: {
    name: string
    project?: string | null
    protocol_id?: string | null
    sample_id?: string | null
    report_template_id?: string | null
    owner_id: string
  },
  orgId: string
): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('experiments')
    .insert({ ...payload, org_id: orgId })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateExperiment(
  id: string,
  payload: {
    name?: string
    project?: string | null
    protocol_id?: string | null
    sample_id?: string | null
    report_template_id?: string | null
  },
  orgId: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('experiments')
    .update({ ...payload, last_edited_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', orgId)
  if (error) throw error
}

export async function deleteExperiment(id: string, orgId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('experiments').delete().eq('id', id).eq('org_id', orgId)
  if (error) throw error
}
