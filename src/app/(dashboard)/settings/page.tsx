import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth-helpers'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const { user, orgId } = await getAuthContext()
  const supabase = await createClient()

  const { data: userRow } = await supabase
    .from('users')
    .select('role, organizations(id, name)')
    .eq('id', user.id)
    .single()
  const orgName = (userRow?.organizations as { name: string } | null)?.name ?? ''
  const isAdmin = userRow?.role === 'admin'

  const { data: membersRows } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  const members = (membersRows ?? []).map((row) => ({
    id: row.id,
    email: row.email ?? '',
    role: row.role === 'admin' ? ('admin' as const) : ('member' as const),
    created_at: row.created_at,
  }))

  return (
    <div>
      <h1 className="text-[22px] font-[700] text-nb-charcoal mb-8 font-nb-mono">Settings</h1>
      <SettingsClient
        orgId={orgId}
        orgName={orgName}
        isAdmin={isAdmin}
        members={members}
        currentUserId={user.id}
      />
    </div>
  )
}
