import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test DB connection
    const { data: orgs, error: orgErr } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(3)

    // Test auth
    const { data: { user } } = await supabase.auth.getUser()

    // Test user row if authenticated
    let userRow = null
    let orgId = null
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('id, org_id, email, role')
        .eq('id', user.id)
        .single()
      userRow = data
      orgId = data?.org_id ?? null
    }

    return NextResponse.json({
      ok: true,
      db: orgErr ? { error: orgErr.message } : { organizations: orgs },
      auth: {
        authenticated: !!user,
        userId: user?.id ?? null,
        email: user?.email ?? null,
      },
      userRow,
      orgId,
      env: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        mistralKey: !!process.env.MISTRAL_API_KEY,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '(not set)',
      },
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
