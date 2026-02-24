'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, TestTube } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import Button from '@/components/ui/nb/Button'
import Modal from '@/components/ui/nb/Modal'
import Input from '@/components/ui/nb/Input'
import ResourceRowActions from './ResourceRowActions'
import type { Sample } from '@/lib/supabase/types'

interface SamplesTabProps {
  orgId: string
  userId: string
}

export default function SamplesTab({ orgId, userId }: SamplesTabProps) {
  const [samples, setSamples] = useState<(Sample & { owner_email?: string | null })[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('samples')
      .select('*, owner:users!owner_id(email)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    setSamples((data ?? []).map((s) => ({
      ...s,
      owner_email: (s.owner as { email: string } | null)?.email ?? null,
    })))
  }, [orgId])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('samples').insert({ name: name.trim(), owner_id: userId, org_id: orgId })
    if (error) { toast.error('Failed to create sample'); setSaving(false); return }
    toast.success('Sample created')
    setName('')
    setModalOpen(false)
    load()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('samples').delete().eq('id', id)
    toast.success('Sample deleted')
    load()
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} strokeWidth={1.5} />
          Add Sample
        </Button>
      </div>

      {samples.length === 0 ? (
        <div className="text-center py-16 font-nb-mono">
          <TestTube size={40} strokeWidth={1} className="mx-auto mb-3 text-nb-muted-light" />
          <p className="text-[13px] text-nb-muted">No samples yet. Add your first sample.</p>
        </div>
      ) : (
        <div className="bg-white border border-nb-cream-border rounded-[8px] overflow-hidden font-nb-mono">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-nb-cream-border bg-nb-cream">
                {['Name', 'Owner', 'Created', ''].map((h) => (
                  <th key={h} className="text-[11px] font-[600] uppercase tracking-[0.04em] text-nb-muted py-2.5 px-4 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {samples.map((s) => (
                <tr key={s.id} className="border-b border-nb-cream-border last:border-0 hover:bg-nb-cream transition-colors">
                  <td className="py-3 px-4 text-[13px] font-[600] text-nb-charcoal">{s.name}</td>
                  <td className="py-3 px-4 text-[13px] text-nb-muted">{s.owner_email ?? '—'}</td>
                  <td className="py-3 px-4 text-[13px] text-nb-muted">{formatDate(s.created_at)}</td>
                  <td className="py-3 px-4">
                    <ResourceRowActions onDelete={() => handleDelete(s.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Sample">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Name *" placeholder="e.g. HeLa cells — batch 12" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
