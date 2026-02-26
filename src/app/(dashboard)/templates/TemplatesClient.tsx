'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { FileText, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Button from '@/components/ui/nb/Button'
import TemplateActions from './TemplateActions'
import type { TemplateWithCount } from '@/lib/queries/templates'

interface TemplatesClientProps {
  templates: TemplateWithCount[]
  orgId: string
}

export default function TemplatesClient({ templates, orgId }: TemplatesClientProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) => t.title.toLowerCase().includes(q))
  }, [templates, query])

  const grouped = useMemo(
    () =>
      filtered.reduce<{ letter: string; items: TemplateWithCount[] }[]>((acc, tpl) => {
        const letter = (tpl.title[0] ?? '#').toUpperCase()
        const existing = acc.find((g) => g.letter === letter)
        if (existing) {
          existing.items.push(tpl)
        } else {
          acc.push({ letter, items: [tpl] })
        }
        return acc
      }, []),
    [filtered]
  )

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center font-nb-mono">
        <FileText size={40} strokeWidth={1} className="text-nb-muted-light mb-4" />
        <p className="text-[15px] font-[600] text-nb-charcoal mb-1">No templates yet</p>
        <p className="text-[13px] text-nb-muted mb-6">Create reusable report templates for your experiments.</p>
        <Link href="/templates/new">
          <Button variant="primary">Create your first template</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="font-nb-mono">
      <div className="flex justify-end mb-3">
        <div className="relative w-full max-w-[260px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nb-muted">
            <Search size={14} strokeWidth={1.5} />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-nb-cream-border rounded-[6px] bg-white text-nb-charcoal placeholder:text-nb-muted focus:outline-none focus:ring-1 focus:ring-nb-green/40"
          />
        </div>
      </div>

      <div className="bg-white border border-nb-cream-border rounded-[8px] overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-nb-cream-border bg-nb-cream">
              {['Title', 'Owner', 'Last updated', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="text-[11px] font-[600] uppercase tracking-[0.04em] text-nb-muted py-2.5 px-4 text-left"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.map((group) => (
              <Fragment key={group.letter}>
                <tr>
                  <td
                    colSpan={4}
                    className="bg-nb-cream/60 text-[10px] font-[600] uppercase tracking-[0.12em] text-nb-muted px-4 py-1.5"
                  >
                    {group.letter}
                  </td>
                </tr>
                {group.items.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-nb-cream-border last:border-0 hover:bg-nb-cream transition-colors"
                  >
                    <td className="py-3 px-4 text-[13px] font-[600] text-nb-charcoal">{t.title}</td>
                    <td className="py-3 px-4 text-[13px] text-nb-muted">{t.owner_email ?? '—'}</td>
                    <td className="py-3 px-4 text-[13px] text-nb-muted">{formatDate(t.created_at)}</td>
                    <td className="py-3 px-4">
                      <TemplateActions templateId={t.id} orgId={orgId} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

