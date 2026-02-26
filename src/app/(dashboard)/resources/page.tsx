'use client'

import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import Tabs from '@/components/ui/nb/Tabs'
import SamplesTab from '@/components/resources/SamplesTab'
import MachinesTab from '@/components/resources/MachinesTab'
import ReagentsTab from '@/components/resources/ReagentsTab'
import { createClient } from '@/lib/supabase/client'

const TABS = [
  { id: 'samples', label: 'Samples' },
  { id: 'machines', label: 'Equipment' },
  { id: 'reagents', label: 'Reagents' },
]

function LockedSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
      <div className="opacity-40 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-none flex flex-col items-center gap-2 px-4 py-3 rounded-[8px] bg-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
          <Lock size={18} strokeWidth={1.5} className="text-nb-muted" />
          <p className="text-[12px] font-[600] text-nb-muted">For lab managers only.</p>
        </div>
      </div>
    </div>
  )
}

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('samples')
  const [orgId, setOrgId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLabManager, setIsLabManager] = useState<boolean | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('users').select('org_id, user_type').eq('id', user.id).single()
      if (data) {
        setOrgId(data.org_id)
        setIsLabManager(data.user_type === 'lab_manager')
      }
    }
    loadUser()
  }, [])

  if (!orgId || !userId || isLabManager === null) {
    return <div className="font-nb-mono text-[13px] text-nb-muted">Loading...</div>
  }

  const content = (
    <>
      {activeTab === 'samples' && <SamplesTab orgId={orgId} userId={userId} />}
      {activeTab === 'machines' && <MachinesTab orgId={orgId} />}
      {activeTab === 'reagents' && <ReagentsTab orgId={orgId} />}
    </>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-[700] text-nb-charcoal">Resources</h1>
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {isLabManager ? content : <LockedSection>{content}</LockedSection>}
    </div>
  )
}
