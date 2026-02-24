import Link from 'next/link'
import { Filter, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDateGroupKey } from '@/lib/utils'
import DateGroup from '@/components/notebook/DateGroup'
import Button from '@/components/ui/nb/Button'
import Tooltip from '@/components/ui/nb/Tooltip'

async function getNotebookData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { experiments: [], orgId: '' }

  const { data: userRow } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!userRow) return { experiments: [], orgId: '' }
  const orgId = userRow.org_id

  const { data } = await supabase
    .from('experiments')
    .select(`
      *,
      owner:users!owner_id(email),
      protocol:protocols!protocol_id(name),
      sample:samples!sample_id(name),
      reports(id),
      experiment_files(id)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  const experiments = (data ?? []).map((row) => ({
    ...row,
    owner_email: (row.owner as { email: string } | null)?.email ?? null,
    protocol_name: (row.protocol as { name: string } | null)?.name ?? null,
    sample_name: (row.sample as { name: string } | null)?.name ?? null,
    has_report: Array.isArray(row.reports) && row.reports.length > 0,
    file_count: Array.isArray(row.experiment_files) ? row.experiment_files.length : 0,
  }))

  return { experiments, orgId }
}

export default async function NotebookPage() {
  const { experiments } = await getNotebookData()

  // Group by date
  const groups = new Map<string, typeof experiments>()
  for (const exp of experiments) {
    const key = formatDateGroupKey(exp.created_at)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(exp)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[22px] font-[700] text-nb-charcoal">Lab Notebook</h1>
        <div className="flex items-center gap-2">
          <Tooltip content="Coming soon — AI search across all your experiments">
            <Button variant="secondary" disabled>
              <Sparkles size={14} strokeWidth={1.5} />
              Smart Research
            </Button>
          </Tooltip>
          <button className="p-2 text-nb-muted hover:text-nb-charcoal hover:bg-nb-cream rounded-[6px] transition-colors">
            <Filter size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Content */}
      {experiments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-nb-cream-dark flex items-center justify-center mb-4">
            <span className="text-[24px]">🔬</span>
          </div>
          <p className="text-[15px] font-[600] text-nb-charcoal mb-1">No experiments yet</p>
          <p className="text-[13px] text-nb-muted mb-6">Start logging your first experiment to fill your notebook.</p>
          <Link href="/experiments/new">
            <Button variant="primary">Start your first experiment →</Button>
          </Link>
        </div>
      ) : (
        <div>
          {Array.from(groups.entries()).map(([date, exps], i) => (
            <div key={date}>
              {i > 0 && <div className="border-t border-nb-cream-border mb-8" />}
              <DateGroup date={date} experiments={exps} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
