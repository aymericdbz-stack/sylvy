import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return { user, supabase }
}

export async function getUserOrg(userId: string): Promise<string> {
  const supabase = await createClient()
  const { data: userRow } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', userId)
    .single()

  const orgId = userRow?.org_id

  // No org row yet means the user completed auth but not the lab-setup step.
  // Send them back to choose-tool so they can finish signup.
  if (!orgId) {
    redirect('/choose-tool')
  }

  return orgId
}

/**
 * Single call that returns both the authenticated user and their org_id.
 * Redirects to /login if unauthenticated, or /choose-tool if org setup is incomplete.
 */
export async function getAuthContext() {
  const { user } = await getAuthenticatedUser()
  const orgId = await getUserOrg(user.id)
  return { user, orgId }
}
