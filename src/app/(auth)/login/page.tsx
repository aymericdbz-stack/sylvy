'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/nb/Button'
import Input from '@/components/ui/nb/Input'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    const next = searchParams.get('next') ?? '/choose-tool'
    router.push(next)
    router.refresh()
  }

  return (
    <div className="bg-white border border-nb-cream-border rounded-[8px] p-8">
      <h1 className="text-[15px] font-[600] text-nb-charcoal mb-6">Sign in to your account</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@lab.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && <p className="text-[13px] text-nb-error">{error}</p>}

        <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
          Sign in
        </Button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-nb-cream flex items-center justify-center px-4 font-nb-mono">
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-10">
          <span className="text-[24px] font-[700] text-nb-green">Sylvy</span>
          <p className="text-[11px] text-nb-muted uppercase tracking-[0.08em] mt-1">Wet Lab Intelligence</p>
        </div>

        <Suspense fallback={<div className="bg-white border border-nb-cream-border rounded-[8px] p-8 h-[240px]" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-[13px] text-nb-muted mt-6">
          No account yet?{' '}
          <Link href="/signup" className="text-nb-green hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
