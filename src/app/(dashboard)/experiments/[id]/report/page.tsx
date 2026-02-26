import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser, getUserOrg } from '@/lib/auth-helpers'
import { getReport } from '@/lib/queries/reports'
import { getExperiment } from '@/lib/queries/experiments'
import { formatDate } from '@/lib/utils'
import Button from '@/components/ui/nb/Button'
import ReportEditor from '@/components/reports/ReportEditor'
import ExportPdfButton from '@/components/reports/ExportPdfButton'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user } = await getAuthenticatedUser()
  const orgId = await getUserOrg(user.id)

  const [experiment, report] = await Promise.all([
    getExperiment(id, orgId),
    getReport(id, orgId),
  ])

  if (!experiment || !report) notFound()

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href={`/experiments/${id}`}>
            <button className="flex items-center gap-1.5 text-[13px] text-nb-muted hover:text-nb-charcoal transition-colors mb-2 font-nb-mono">
              ← Back to experiment
            </button>
          </Link>
          <h1 className="text-[22px] font-[700] text-nb-charcoal font-nb-mono">{experiment.name}</h1>
          <p className="text-[11px] text-nb-muted mt-1 font-nb-mono">
            Report created {formatDate(report.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-8">
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
      </div>

      <ReportEditor
        reportId={report.id}
        blocks={report.blocks}
        experimentId={id}
        orgId={orgId}
      />
    </div>
  )
}
