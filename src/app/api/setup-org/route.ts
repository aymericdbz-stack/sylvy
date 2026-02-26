import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(request: Request) {
  // 1. Verify the caller is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Parse body
  let body: { orgName: string; userType?: 'researcher' | 'lab_manager' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const orgName = body.orgName?.trim()
  if (!orgName) {
    return NextResponse.json({ error: 'Lab name is required' }, { status: 400 })
  }

  const userType = body.userType === 'lab_manager' ? 'lab_manager' : 'researcher'

  const sc = getServiceClient()

  // 3. Check if user already has a row (idempotent)
  const { data: existing } = await sc
    .from('users')
    .select('id, org_id')
    .eq('id', user.id)
    .single()

  if (existing?.org_id) {
    return NextResponse.json({ orgId: existing.org_id, alreadyExists: true })
  }

  // 4. Create organization
  const { data: org, error: orgErr } = await sc
    .from('organizations')
    .insert({ name: orgName })
    .select('id')
    .single()

  if (orgErr) {
    return NextResponse.json({ error: orgErr.message }, { status: 500 })
  }

  // 5. Create or update user row (with onboarding user_type: researcher | lab_manager)
  const { error: userErr } = existing
    ? await sc
        .from('users')
        .update({ org_id: org.id, user_type: userType })
        .eq('id', user.id)
    : await sc
        .from('users')
        .insert({
          id: user.id,
          org_id: org.id,
          email: user.email ?? '',
          role: 'admin',
          user_type: userType,
        })

  if (userErr) {
    // Roll back org if user insert fails
    await sc.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: userErr.message }, { status: 500 })
  }

  return NextResponse.json({ orgId: org.id })
}
