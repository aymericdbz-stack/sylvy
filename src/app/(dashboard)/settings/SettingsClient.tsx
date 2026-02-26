'use client'

import { useState } from 'react'
import Tabs from '@/components/ui/nb/Tabs'
import OrgSettings from './OrgSettings'
import MembersSettings from './MembersSettings'
import PreferencesSettings from './PreferencesSettings'

const TABS = [
  { id: 'lab',   label: 'Lab' },
  { id: 'members', label: 'Membres' },
  { id: 'prefs', label: 'Préférences' },
]

interface Props {
  orgId: string
  orgName: string
  isAdmin: boolean
  members: { id: string; email: string; role: string; created_at: string }[]
  currentUserId: string
}

export default function SettingsClient({ orgId, orgName, isAdmin, members, currentUserId }: Props) {
  const [tab, setTab] = useState('lab')

  return (
    <div className="flex flex-col gap-8">
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'lab' && (
        <OrgSettings orgId={orgId} initialName={orgName} isAdmin={isAdmin} />
      )}
      {tab === 'members' && (
        <MembersSettings
          orgId={orgId}
          members={members}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      )}
      {tab === 'prefs' && (
        <PreferencesSettings />
      )}
    </div>
  )
}
