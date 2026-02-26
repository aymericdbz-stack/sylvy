import Link from 'next/link'
import { FileText } from 'lucide-react'
import { getAuthenticatedUser, getUserOrg } from '@/lib/auth-helpers'
import { getTemplates } from '@/lib/queries/templates'
import { formatDate } from '@/lib/utils'
import Button from '@/components/ui/nb/Button'
import Badge from '@/components/ui/nb/Badge'
import TemplateActions from './TemplateActions'

export default async function TemplatesPage() {
  const { user } = await getAuthenticatedUser()
  const orgId = await getUserOrg(user.id)
  const templates = await getTemplates(orgId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-[700] text-nb-charcoal">Report Templates</h1>
        <Link href="/templates/new">
          <Button variant="primary">New Template</Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center font-nb-mono">
          <FileText size={40} strokeWidth={1} className="text-nb-muted-light mb-4" />
          <p className="text-[15px] font-[600] text-nb-charcoal mb-1">No templates yet</p>
          <p className="text-[13px] text-nb-muted mb-6">Create reusable report templates for your experiments.</p>
          <Link href="/templates/new">
            <Button variant="primary">Create your first template</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-nb-cream-border rounded-[8px] overflow-hidden font-nb-mono">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-nb-cream-border bg-nb-cream">
                {['Title', 'Owner', 'Blocks', 'Last updated', 'Actions'].map((h) => (
                  <th key={h} className="text-[11px] font-[600] uppercase tracking-[0.04em] text-nb-muted py-2.5 px-4 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b border-nb-cream-border last:border-0 hover:bg-nb-cream transition-colors">
                  <td className="py-3 px-4 text-[13px] font-[600] text-nb-charcoal">{t.title}</td>
                  <td className="py-3 px-4 text-[13px] text-nb-muted">{t.owner_email ?? '—'}</td>
                  <td className="py-3 px-4"><Badge variant="gray">{t.block_count}</Badge></td>
                  <td className="py-3 px-4 text-[13px] text-nb-muted">{formatDate(t.updated_at)}</td>
                  <td className="py-3 px-4"><TemplateActions templateId={t.id} orgId={orgId} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
