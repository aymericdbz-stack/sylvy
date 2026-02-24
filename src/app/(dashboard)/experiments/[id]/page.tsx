import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser, getUserOrg } from '@/lib/auth-helpers'
import { formatDate, formatDateTime } from '@/lib/utils'
import { getExperiment } from '@/lib/queries/experiments'
import { createReport } from '@/lib/queries/reports'
import Button from '@/components/ui/nb/Button'
import Badge from '@/components/ui/nb/Badge'
import FileUploader from '@/components/experiments/FileUploader'
import ExperimentActions from './ExperimentActions'

export default async function ExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user } = await getAuthenticatedUser()
  const orgId = await getUserOrg(user.id)

  const experiment = await getExperiment(id, orgId)
  if (!experiment) notFound()

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
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
          <Link href={`/experiments/${id}/edit`}>
            <Button variant="secondary" size="sm">Edit</Button>
          </Link>
          <ExperimentActions experimentId={id} orgId={orgId} />
        </div>
      </div>

      {/* Metadata card */}
      <div className="bg-white border border-nb-cream-border rounded-[8px] p-5 mb-6 font-nb-mono">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Project', value: experiment.project ?? '—' },
            { label: 'Protocol', value: experiment.protocol_name ?? '—' },
            { label: 'Sample', value: experiment.sample_name ?? '—' },
            { label: 'Template', value: experiment.template_title ?? '—' },
            { label: 'Created by', value: experiment.owner_email ?? '—' },
            { label: 'Created at', value: formatDate(experiment.created_at) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[11px] font-[600] text-nb-muted uppercase tracking-[0.04em] mb-0.5">{label}</p>
              <p className="text-[13px] text-nb-charcoal">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Files */}
      <div className="mb-6">
        <h2 className="text-[18px] font-[600] text-nb-charcoal mb-4">Raw Data</h2>
        <FileUploader experimentId={id} orgId={orgId} initialFiles={experiment.files} />
      </div>

      {/* Report */}
      <div className="bg-white border border-nb-cream-border rounded-[8px] p-5 font-nb-mono">
        <h2 className="text-[15px] font-[600] text-nb-charcoal mb-3">Report</h2>
        {experiment.has_report ? (
          <div className="flex items-center gap-3">
            <Badge variant="green">Generated</Badge>
            <Link href={`/experiments/${id}/report`}>
              <Button variant="primary" size="sm">Open Report</Button>
            </Link>
          </div>
        ) : experiment.report_template_id ? (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-nb-muted">
              Template: <span className="text-nb-charcoal font-[600]">{experiment.template_title}</span>
            </p>
            <GenerateReportButton experimentId={id} templateId={experiment.report_template_id} userId={user.id} orgId={orgId} />
          </div>
        ) : (
          <p className="text-[13px] text-nb-muted">
            Set a report template to generate a report.{' '}
            <Link href={`/experiments/${id}/edit`} className="text-nb-green hover:underline">Edit experiment</Link>
          </p>
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
    }}>
      <Button type="submit" variant="primary" size="sm">Generate Report</Button>
    </form>
  )
}
