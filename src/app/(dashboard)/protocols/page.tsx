import Link from 'next/link'
import { FlaskConical } from 'lucide-react'
import { getAuthenticatedUser, getUserOrg } from '@/lib/auth-helpers'
import { getProtocols } from '@/lib/queries/protocols'
import { formatInterval, formatDate } from '@/lib/utils'
import Button from '@/components/ui/nb/Button'
import Badge from '@/components/ui/nb/Badge'
import ProtocolActions from './ProtocolActions'

export default async function ProtocolsPage() {
  const { user } = await getAuthenticatedUser()
  const orgId = await getUserOrg(user.id)
  const protocols = await getProtocols(orgId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-[700] text-nb-charcoal">Protocols</h1>
        <Link href="/protocols/new">
          <Button variant="primary">New Protocol</Button>
        </Link>
      </div>

      {protocols.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center font-nb-mono">
          <FlaskConical size={40} strokeWidth={1} className="text-nb-muted-light mb-4" />
          <p className="text-[15px] font-[600] text-nb-charcoal mb-1">No protocols yet</p>
          <p className="text-[13px] text-nb-muted mb-6">Create reusable protocols for your experiments.</p>
          <Link href="/protocols/new">
            <Button variant="primary">Create your first protocol</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-nb-cream-border rounded-[8px] overflow-hidden font-nb-mono">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-nb-cream-border bg-nb-cream">
                {['Name', 'Owner', 'Duration', 'Machines', 'Reagents', 'Actions'].map((h) => (
                  <th key={h} className="text-[11px] font-[600] uppercase tracking-[0.04em] text-nb-muted py-2.5 px-4 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {protocols.map((p) => (
                <tr key={p.id} className="border-b border-nb-cream-border hover:bg-nb-cream transition-colors">
                  <td className="py-3 px-4">
                    <span className="text-[13px] font-[600] text-nb-charcoal">{p.name}</span>
                  </td>
                  <td className="py-3 px-4 text-[13px] text-nb-muted">{p.owner_email ?? '—'}</td>
                  <td className="py-3 px-4 text-[13px] text-nb-charcoal">{formatInterval(p.timing)}</td>
                  <td className="py-3 px-4">
                    <Badge variant="gray">{p.machine_count}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="gray">{p.reagent_count}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <ProtocolActions protocolId={p.id} orgId={orgId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
