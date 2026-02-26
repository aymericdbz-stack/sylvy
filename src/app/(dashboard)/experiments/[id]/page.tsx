import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAuthenticatedUser, getUserOrg } from '@/lib/auth-helpers'
import { formatDate, formatDateTime } from '@/lib/utils'
import { getExperiment } from '@/lib/queries/experiments'
import { createReport, getReport } from '@/lib/queries/reports'
import Button from '@/components/ui/nb/Button'
import FileUploader from '@/components/experiments/FileUploader'
import ExperimentActions from './ExperimentActions'
import ExportPdfButton from '@/components/reports/ExportPdfButton'
import ResultsCommentsEditor from '@/components/experiments/ResultsCommentsEditor'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExperimentPresentationEditor from '@/components/experiments/ExperimentPresentationEditor'

export default async function ExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user } = await getAuthenticatedUser()
  const orgId = await getUserOrg(user.id)
  const supabase = await createClient()

  const [experiment, report, protocolsRes, samplesRes, templatesRes] = await Promise.all([
    getExperiment(id, orgId),
    getReport(id, orgId),
    supabase.from('protocols').select('id, name').eq('org_id', orgId).order('name'),
    supabase.from('samples').select('id, name').eq('org_id', orgId).order('name'),
    supabase.from('report_templates').select('id, title').eq('org_id', orgId).order('title'),
  ])

  if (!experiment) notFound()

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/notebook">
            <button className="flex items-center gap-1.5 text-[13px] text-nb-muted hover:text-nb-charcoal transition-colors mb-2">
              ← Notebook
            </button>
          </Link>
          <h1 className="text-[22px] font-[700] text-nb-charcoal">{experiment.name}</h1>
          <p className="text-[11px] text-nb-muted mt-1">
            Last edited {formatDateTime(experiment.last_edited_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-8">
          <ExperimentActions experimentId={id} orgId={orgId} />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* 1/ Presentation */}
        <ExperimentPresentationEditor
          experimentId={id}
          initial={{
            name: experiment.name,
            project: experiment.project,
            protocol_id: experiment.protocol_id,
            protocol_name: experiment.protocol_name,
            sample_id: experiment.sample_id,
            sample_name: experiment.sample_name,
            report_template_id: experiment.report_template_id,
            template_title: experiment.template_title,
            owner_email: experiment.owner_email,
            created_at: experiment.created_at,
          }}
          protocols={(protocolsRes.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
          samples={(samplesRes.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
          templates={(templatesRes.data ?? []).map((t) => ({ value: t.id, label: t.title }))}
          createdAtLabel={formatDate(experiment.created_at)}
        />

        {/* 2/ Lab notebook + 3/ Results + 4/ Comments */}
        <ResultsCommentsEditor
          reportId={report?.id ?? null}
          experimentId={id}
          orgId={orgId}
          blocks={report?.blocks ?? []}
        />

        {/* (Optional) Report generation */}
        {!experiment.has_report && (
          <div className="bg-white border border-nb-cream-border rounded-[8px] p-5 font-nb-mono">
            <h2 className="text-[13px] font-[700] text-nb-muted uppercase tracking-[0.06em] mb-4">Report</h2>
            {experiment.report_template_id ? (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] text-nb-muted">
                  Template: <span className="text-nb-charcoal font-[600]">{experiment.template_title}</span>
                </p>
                <GenerateReportButton
                  experimentId={id}
                  templateId={experiment.report_template_id}
                  userId={user.id}
                  orgId={orgId}
                />
              </div>
            ) : (
              <p className="text-[13px] text-nb-muted">
                Set a report template to generate a report.{' '}
                  <Link href={`/experiments/${id}?edit=presentation`} className="text-nb-green hover:underline">
                    Edit presentation
                </Link>
              </p>
            )}
          </div>
        )}

        {/* 5/ Raw Data */}
        <div className="bg-white border border-nb-cream-border rounded-[8px] p-5">
          <h2 className="text-[13px] font-[700] text-nb-muted uppercase tracking-[0.06em] mb-4 font-nb-mono">Raw Data</h2>
          <FileUploader experimentId={id} orgId={orgId} initialFiles={experiment.files} />
        </div>

        {/* Export PDF at end of page */}
        {experiment.has_report && report && (
          <div className="flex justify-end">
            <ExportPdfButton
              experimentId={id}
              experimentName={experiment.name}
              createdAt={report.created_at}
              blocks={report.blocks}
              project={experiment.project}
              protocolName={experiment.protocol_name}
              sampleName={experiment.sample_name}
              templateTitle={experiment.template_title}
              createdBy={experiment.owner_email}
              experimentCreatedAt={experiment.created_at}
              initialFiles={experiment.files}
            />
          </div>
        )}
      </div>
    </div>
  )
}

async function GenerateReportButton({
  experimentId, templateId, userId, orgId,
}: { experimentId: string; templateId: string; userId: string; orgId: string }) {
  return (
    <form action={async () => {
      'use server'
      await createReport(experimentId, templateId, userId, orgId)
      redirect(`/experiments/${experimentId}`)
    }}>
      <Button type="submit" variant="primary" size="sm">Generate Report</Button>
    </form>
  )
}
