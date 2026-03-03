'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, BarChart2, Brain, Sparkles, ArrowRight, Clock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/nb/Button'
import Input from '@/components/ui/nb/Input'

const tools = [
  {
    id: 'survey',
    icon: Sparkles,
    label: 'Get 3 months of Sylvy for free',
    description: 'Answer a short survey and unlock full access to the platform.',
    cta: 'Start survey',
    href: '/survey',
    available: true,
    accent: '#00AC73',
  },
  {
    id: 'notebook',
    icon: BookOpen,
    label: 'Sylvy notebook',
    description: 'Log experiments, manage protocols, and generate AI reports.',
    cta: 'Open Notebook',
    href: '/notebook',
    available: true,
    accent: '#00AC73',
  },
  {
    id: 'planner',
    icon: BarChart2,
    label: 'Sylvy planner',
    description: 'Plan and track your lab projects across your team.',
    cta: 'Open Planner',
    href: '/planner',
    available: true,
    accent: '#00AC73',
  },
  {
    id: 'labmind',
    icon: Brain,
    label: 'Sylvy labmind',
    description: 'AI-powered insights and predictions from your lab data.',
    cta: 'Coming soon',
    href: null,
    available: false,
    accent: '#9CA3AF',
  },
]

type PageState = 'loading' | 'setup-needed' | 'ready'

export default function ChooseToolPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [orgName, setOrgName] = useState('')
  const [setupError, setSetupError] = useState<string | null>(null)
  const [setupLoading, setSetupLoading] = useState(false)

  useEffect(() => {
    const checkSetup = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user has a row in public.users (i.e. org setup complete)
      const { data: userRow } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single()

      if (userRow?.org_id) {
        setPageState('ready')
      } else {
        setPageState('setup-needed')
      }
    }
    checkSetup()
  }, [router])

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim()) return
    setSetupError(null)
    setSetupLoading(true)

    const res = await fetch('/api/setup-org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgName: orgName.trim() }),
    })

    const data = await res.json()

    if (!res.ok) {
      setSetupError(data.error ?? 'Failed to create lab. Please try again.')
      setSetupLoading(false)
      return
    }

    setPageState('ready')
    setSetupLoading(false)
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-nb-cream flex items-center justify-center font-nb-mono">
        <Loader2 size={24} className="animate-spin text-nb-green" />
      </div>
    )
  }

  // ── Lab setup needed ─────────────────────────────────────────────────────────
  if (pageState === 'setup-needed') {
    return (
      <div className="min-h-screen bg-nb-cream flex items-center justify-center px-4 font-nb-mono">
        <div className="w-full max-w-[380px]">
          <div className="text-center mb-8">
            <span className="text-[26px] font-[700] text-nb-green">Sylvy</span>
            <p className="text-[11px] text-nb-muted uppercase tracking-[0.08em] mt-1">Wet Lab Intelligence</p>
            <h1 className="text-[18px] font-[700] text-nb-charcoal mt-8 mb-1">One last step</h1>
            <p className="text-[13px] text-nb-muted">Give your lab a name to get started.</p>
          </div>

          <div className="bg-white border border-nb-cream-border rounded-[8px] p-6">
            <form onSubmit={handleCreateLab} className="flex flex-col gap-4">
              <Input
                label="Lab name"
                placeholder="e.g. Dupont Lab, BioTech Inc."
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                autoFocus
              />
              {setupError && (
                <p className="text-[12px] text-nb-error">{setupError}</p>
              )}
              <Button
                type="submit"
                variant="primary"
                loading={setupLoading}
                className="w-full"
              >
                Create lab & continue
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── Tool selector ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-nb-cream flex flex-col items-center justify-center px-4 py-16 font-nb-mono">
      <div className="text-center mb-12">
        <span className="text-[26px] font-[700] text-nb-green">Sylvy</span>
        <p className="text-[11px] text-nb-muted uppercase tracking-[0.08em] mt-1">Wet Lab Intelligence</p>
        <h1 className="text-[20px] font-[700] text-nb-charcoal mt-8 mb-2">
          What would you like to do?
        </h1>
        <p className="text-[13px] text-nb-muted max-w-[360px] mx-auto">
          Choose a tool to get started. You can switch anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[680px]">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              onClick={() => {
                if (tool.available && tool.href) router.push(tool.href)
              }}
              disabled={!tool.available}
              className={[
                'group relative flex flex-col gap-4 p-6 bg-white border rounded-[10px] text-left transition-all duration-150',
                tool.available
                  ? 'border-nb-cream-border hover:border-nb-green hover:shadow-sm cursor-pointer'
                  : 'border-nb-cream-border opacity-60 cursor-not-allowed',
              ].join(' ')}
            >
              {!tool.available && (
                <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-[600] uppercase tracking-[0.06em] text-nb-muted bg-nb-cream px-2 py-0.5 rounded-full border border-nb-cream-border">
                  <Clock size={10} />
                  Soon
                </span>
              )}

              <div
                className="w-9 h-9 rounded-[8px] flex items-center justify-center"
                style={{ background: tool.available ? '#E6F7F2' : '#F3F4F6' }}
              >
                <Icon size={18} style={{ color: tool.accent }} strokeWidth={1.5} />
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <p className="text-[14px] font-[700] text-nb-charcoal leading-snug">{tool.label}</p>
                <p className="text-[12px] text-nb-muted leading-relaxed">{tool.description}</p>
              </div>

              <div
                className={[
                  'flex items-center gap-1.5 text-[12px] font-[600] transition-colors',
                  tool.available ? 'text-nb-green group-hover:gap-2.5' : 'text-nb-muted',
                ].join(' ')}
              >
                {tool.cta}
                {tool.available && <ArrowRight size={13} strokeWidth={2} />}
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-[11px] text-nb-muted mt-10">
        Need help?{' '}
        <a href="mailto:hello@sylvy.co" className="text-nb-green hover:underline">
          Contact us
        </a>
      </p>
    </div>
  )
}
