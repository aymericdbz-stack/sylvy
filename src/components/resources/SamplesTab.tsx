'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, TestTube } from 'lucide-react'
import { format } from 'date-fns'
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

type SampleRow = Sample & { owner_email?: string | null }

/** yyyy-MM-dd → ISO string for created_at (start of day UTC) */
function dateInputToIso(value: string): string | undefined {
  if (!value) return undefined
  return `${value}T00:00:00.000Z`
}

/** created_at ISO → yyyy-MM-dd for input[type="date"] */
function createdAtToDateInput(createdAt: string): string {
  return format(new Date(createdAt), 'yyyy-MM-dd')
}

export default function SamplesTab({ orgId, userId }: SamplesTabProps) {
  const [samples, setSamples] = useState<SampleRow[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [createdDate, setCreatedDate] = useState('')
  const [saving, setSaving] = useState(false)

  const [editSample, setEditSample] = useState<SampleRow | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCreatedDate, setEditCreatedDate] = useState('')

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

  const openEdit = (s: SampleRow) => {
    setEditSample(s)
    setEditName(s.name)
    setEditDescription(s.description ?? '')
    setEditCreatedDate(createdAtToDateInput(s.created_at))
  }

  const closeAddModal = () => {
    setModalOpen(false)
    setName('')
    setDescription('')
    setCreatedDate('')
  }

  const closeEditModal = () => {
    setEditSample(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload: { name: string; owner_id: string; org_id: string; description?: string | null; created_at?: string } = {
      name: name.trim(),
      owner_id: userId,
      org_id: orgId,
    }
    if (description.trim()) payload.description = description.trim()
    const isoDate = dateInputToIso(createdDate)
    if (isoDate) payload.created_at = isoDate
    const { error } = await supabase.from('samples').insert(payload)
    if (error) { toast.error('Failed to create sample'); setSaving(false); return }
    toast.success('Sample created')
    closeAddModal()
    load()
    setSaving(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editSample || !editName.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload: { name?: string; description?: string | null; created_at?: string } = {
      name: editName.trim(),
      description: editDescription.trim() || null,
    }
    const isoDate = dateInputToIso(editCreatedDate)
    if (isoDate) payload.created_at = isoDate
    const { error } = await supabase.from('samples').update(payload).eq('id', editSample.id).eq('org_id', orgId)
    if (error) { toast.error('Failed to update sample'); setSaving(false); return }
    toast.success('Sample updated')
    closeEditModal()
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
                {['Name', 'Owner', 'Description', 'Created', ''].map((h) => (
                  <th key={h} className="text-[11px] font-[600] uppercase tracking-[0.04em] text-nb-muted py-2.5 px-4 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {samples.map((s) => (
                <tr key={s.id} className="border-b border-nb-cream-border last:border-0 hover:bg-nb-cream transition-colors">
                  <td className="py-3 px-4 text-[13px] font-[600] text-nb-charcoal">{s.name}</td>
                  <td className="py-3 px-4 text-[13px] text-nb-muted">{s.owner_email ?? '—'}</td>
                  <td className="py-3 px-4 text-[13px] text-nb-muted">{s.description ?? '—'}</td>
                  <td className="py-3 px-4 text-[13px] text-nb-muted">{formatDate(s.created_at)}</td>
                  <td className="py-3 px-4">
                    <ResourceRowActions onDelete={() => handleDelete(s.id)} onEdit={() => openEdit(s)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={closeAddModal} title="Add Sample">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Name *" placeholder="e.g. HeLa cells — batch 12" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Description" placeholder="Optional description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="Date" type="date" value={createdDate} onChange={(e) => setCreatedDate(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeAddModal}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving}>Create</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editSample} onClose={closeEditModal} title="Edit Sample">
        {editSample && (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <Input label="Name *" placeholder="e.g. HeLa cells — batch 12" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <Input label="Description" placeholder="Optional description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            <Input label="Created date" type="date" value={editCreatedDate} onChange={(e) => setEditCreatedDate(e.target.value)} />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={closeEditModal}>Cancel</Button>
              <Button type="submit" variant="primary" loading={saving}>Save</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
