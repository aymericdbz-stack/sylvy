'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function ResourcesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('samples')
  const [orgId, setOrgId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('users').select('org_id, user_type').eq('id', user.id).single()
      if (data) {
        setOrgId(data.org_id)
        setAllowed(data.user_type === 'lab_manager')
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (allowed === false) router.replace('/notebook')
  }, [allowed, router])

  if (allowed === false || !orgId || !userId) {
    return <div className="font-nb-mono text-[13px] text-nb-muted">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-[700] text-nb-charcoal">Resources</h1>
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'samples' && <SamplesTab orgId={orgId} userId={userId} />}
      {activeTab === 'machines' && <MachinesTab orgId={orgId} />}
      {activeTab === 'reagents' && <ReagentsTab orgId={orgId} />}
    </div>
  )
}
