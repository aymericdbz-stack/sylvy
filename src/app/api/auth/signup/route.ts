import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email, password, orgName } = await req.json()

  if (!email || !password || !orgName?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is not set in .env.local' },
      { status: 500 }
    )
  }

  // Admin client — bypasses RLS, never exposed to browser
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Create auth user (email_confirm: true = auto-confirmed, no email needed)
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 400 })
  }

  const userId = authData.user.id

  // 2. Create organization
  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .insert({ name: orgName.trim() })
    .select('id')
    .single()

  if (orgErr) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: orgErr.message }, { status: 400 })
  }

  // 3. Create user profile row
  const { error: userErr } = await admin.from('users').insert({
    id:     userId,
    org_id: org.id,
    email,
    role:   'admin',
  })

  if (userErr) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: userErr.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
