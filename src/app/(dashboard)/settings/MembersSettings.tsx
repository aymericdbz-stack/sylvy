'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import Button from '@/components/ui/nb/Button'
import Modal from '@/components/ui/nb/Modal'
import Input from '@/components/ui/nb/Input'
import Badge from '@/components/ui/nb/Badge'

interface Member {
  id: string
  email: string
  role: 'admin' | 'member'
  created_at: string
}

interface MembersSettingsProps {
  orgId: string
  members: Member[]
  currentUserId: string
  isAdmin: boolean
}

export default function MembersSettings({ orgId, members: initialMembers, currentUserId, isAdmin }: MembersSettingsProps) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
    const supabase = createClient()
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', memberId)
    if (error) { toast.error('Failed to update role'); return }
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m))
    toast.success('Role updated')
  }

  const handleRemove = async (memberId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('users').delete().eq('id', memberId)
    if (error) { toast.error('Failed to remove member'); return }
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
    toast.success('Member removed')
  }

  return (
    <div className="bg-white border border-nb-cream-border rounded-[8px] p-6 font-nb-mono">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[15px] font-[600] text-nb-charcoal">Members</h2>
        {isAdmin && (
          <Button variant="secondary" size="sm" onClick={() => setInviteOpen(true)}>
            Invite member
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-nb-cream-border bg-nb-cream">
              {['Email', 'Role', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="text-[11px] font-[600] uppercase tracking-[0.04em] text-nb-muted py-2.5 px-4 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-nb-cream-border last:border-0 hover:bg-nb-cream transition-colors">
                <td className="py-3 px-4 text-[13px] text-nb-charcoal">{m.email}</td>
                <td className="py-3 px-4">
                  {isAdmin && m.id !== currentUserId ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value as 'admin' | 'member')}
                      className="text-[13px] text-nb-charcoal bg-transparent border border-nb-cream-border rounded-[4px] px-2 py-1 outline-none focus:border-nb-green cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <Badge variant={m.role === 'admin' ? 'green' : 'gray'}>{m.role}</Badge>
                  )}
                </td>
                <td className="py-3 px-4 text-[13px] text-nb-muted">{formatDate(m.created_at)}</td>
                <td className="py-3 px-4">
                  {isAdmin && m.id !== currentUserId && (
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="text-[11px] text-nb-muted hover:text-nb-error transition-colors opacity-50 hover:opacity-100"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite member">
        <div className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="colleague@lab.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <p className="text-[11px] text-nb-muted-light">
            Note: Direct invite is coming soon. Ask your colleague to sign up and you can assign their role after.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { toast.info('Invite feature coming soon'); setInviteOpen(false) }}>
              Send invite
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
