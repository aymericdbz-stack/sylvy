'use client'

import { useState } from 'react'
import Tabs from '@/components/ui/nb/Tabs'
import OrgSettings from './OrgSettings'
import MembersSettings from './MembersSettings'
import PreferencesSettings from './PreferencesSettings'
import AppearanceSettings from './AppearanceSettings'

const TABS = [
  { id: 'lab',        label: 'Lab' },
  { id: 'members',    label: 'Membres' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'prefs',      label: 'Préférences' },
]

type Member = { id: string; email: string; role: 'admin' | 'member'; created_at: string }

interface Props {
  orgId: string
  orgName: string
  isAdmin: boolean
  members: Member[]
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
      {tab === 'appearance' && (
        <AppearanceSettings />
      )}
      {tab === 'prefs' && (
        <PreferencesSettings />
      )}
    </div>
  )
}
