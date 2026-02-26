'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/nb/Input'
import Button from '@/components/ui/nb/Button'

interface OrgSettingsProps {
  orgId: string
  initialName: string
  isAdmin: boolean
}

export default function OrgSettings({ orgId, initialName, isAdmin }: OrgSettingsProps) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('organizations').update({ name: name.trim() }).eq('id', orgId)
    if (error) { toast.error('Failed to update organization name'); setSaving(false); return }
    toast.success('Organization name updated')
    setSaving(false)
  }

  return (
    <div className="bg-white border border-nb-cream-border rounded-[8px] p-6 font-nb-mono">
      <h2 className="text-[15px] font-[600] text-primary mb-5">Organization</h2>
      <form onSubmit={handleSave} className="flex flex-col gap-4 max-w-[420px]">
        <Input
          label="Organization name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isAdmin}
          placeholder="Your lab name"
        />
        {isAdmin && (
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={saving}>Save changes</Button>
          </div>
        )}
        {!isAdmin && (
          <p className="text-[11px] text-nb-muted-light">Only admins can change the organization name.</p>
        )}
      </form>
    </div>
  )
}
