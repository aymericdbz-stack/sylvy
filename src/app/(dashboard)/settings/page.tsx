import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth-helpers'
import OrgSettings from './OrgSettings'
import MembersSettings from './MembersSettings'

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

  const { data: members } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  return (
    <div>
      <h1 className="text-[22px] font-[700] text-nb-charcoal mb-8 font-nb-mono">Settings</h1>

      <div className="flex flex-col gap-8">
        <OrgSettings orgId={orgId} initialName={orgName} isAdmin={isAdmin} />
        <div className="border-t border-nb-cream-border" />
        <MembersSettings
          orgId={orgId}
          members={members ?? []}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
