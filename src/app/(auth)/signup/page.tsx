'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/nb/Button'
import Input from '@/components/ui/nb/Input'
import { toast } from 'sonner'

type Step = 1 | 2

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      setUserId(data.user.id)
    }
    setLoading(false)
    setStep(2)
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim() || !userId) return
    setError(null)
    setLoading(true)

    // Use server-side API route (service role) so RLS doesn't block org/user creation
    const res = await fetch('/api/setup-org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgName: orgName.trim() }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to create lab. Please try again.')
      setLoading(false)
      return
    }

    router.push('/choose-tool')
    router.refresh()
  }

  const handleJoinOrg = () => {
    toast.info('Invite feature coming soon')
  }

  return (
    <div className="min-h-screen bg-nb-cream flex items-center justify-center px-4 font-nb-mono">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-[24px] font-[700] text-nb-green">Sylvy</span>
          <p className="text-[11px] text-nb-muted uppercase tracking-[0.08em] mt-1">Wet Lab Intelligence</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-nb-green' : 'bg-nb-cream-border'}`} />
          <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-nb-green' : 'bg-nb-cream-border'}`} />
        </div>

        <div className="bg-white border border-nb-cream-border rounded-[8px] p-8">
          {step === 1 && (
            <>
              <h1 className="text-[15px] font-[600] text-nb-charcoal mb-6">Create your account</h1>
              <form onSubmit={handleStep1} className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@lab.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {error && <p className="text-[13px] text-nb-error">{error}</p>}
                <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
                  Continue
                </Button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-[15px] font-[600] text-nb-charcoal mb-2">Set up your lab</h1>
              <p className="text-[13px] text-nb-muted mb-6">Create a new lab or join an existing one.</p>

              <div className="grid grid-cols-2 gap-3">
                {/* Create org */}
                <div className="flex flex-col gap-3 p-4 border border-nb-cream-border rounded-[8px]">
                  <p className="text-[13px] font-[600] text-nb-charcoal">Create a new lab</p>
                  <form onSubmit={handleCreateOrg} className="flex flex-col gap-3">
                    <Input
                      placeholder="Lab name..."
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                    />
                    {error && <p className="text-[11px] text-nb-error">{error}</p>}
                    <Button type="submit" variant="primary" size="sm" loading={loading}>
                      Create & continue
                    </Button>
                  </form>
                </div>

                {/* Join org */}
                <div className="flex flex-col gap-3 p-4 border border-nb-cream-border rounded-[8px]">
                  <p className="text-[13px] font-[600] text-nb-charcoal">Join an existing lab</p>
                  <Input placeholder="Invite code..." disabled />
                  <Button type="button" variant="secondary" size="sm" onClick={handleJoinOrg}>
                    Join
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[13px] text-nb-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-nb-green hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
