'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Cpu } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import Button from '@/components/ui/nb/Button'
import Modal from '@/components/ui/nb/Modal'
import Input from '@/components/ui/nb/Input'
import Select from '@/components/ui/nb/Select'
import Badge from '@/components/ui/nb/Badge'
import ResourceRowActions from './ResourceRowActions'
import type { Machine } from '@/lib/supabase/types'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
]

const statusBadge = (status: Machine['status']) => {
  if (status === 'active') return <Badge variant="green">Active</Badge>
  if (status === 'maintenance') return <Badge variant="warning">Maintenance</Badge>
  return <Badge variant="gray">Inactive</Badge>
}

export default function MachinesTab({ orgId }: { orgId: string }) {
  const [machines, setMachines] = useState<Machine[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [model, setModel] = useState('')
  const [status, setStatus] = useState<Machine['status']>('active')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('machines').select('*').eq('org_id', orgId).order('created_at', { ascending: false })
    setMachines(data ?? [])
  }, [orgId])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('machines').insert({ name: name.trim(), model: model || null, status, org_id: orgId })
    if (error) { toast.error('Failed to create machine'); setSaving(false); return }
    toast.success('Machine added')
    setName(''); setModel(''); setStatus('active'); setModalOpen(false)
    load(); setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('machines').delete().eq('id', id)
    toast.success('Machine deleted')
    load()
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} strokeWidth={1.5} /> Add Machine
        </Button>
      </div>

      {machines.length === 0 ? (
        <div className="text-center py-16 font-nb-mono">
          <Cpu size={40} strokeWidth={1} className="mx-auto mb-3 text-nb-muted-light" />
          <p className="text-[13px] text-nb-muted">No machines yet. Add your first machine.</p>
        </div>
      ) : (
        <div className="bg-white border border-nb-cream-border rounded-[8px] overflow-hidden font-nb-mono">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-nb-cream-border bg-nb-cream">
                {['Name', 'Model', 'Status', 'Created', ''].map((h) => (
                  <th key={h} className="text-[11px] font-[600] uppercase tracking-[0.04em] text-nb-muted py-2.5 px-4 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => (
                <tr key={m.id} className="border-b border-nb-cream-border last:border-0 hover:bg-nb-cream transition-colors">
                  <td className="py-3 px-4 text-[13px] font-[600] text-nb-charcoal">{m.name}</td>
                  <td className="py-3 px-4 text-[13px] text-nb-muted">{m.model ?? '—'}</td>
                  <td className="py-3 px-4">{statusBadge(m.status)}</td>
                  <td className="py-3 px-4 text-[13px] text-nb-muted">{formatDate(m.created_at)}</td>
                  <td className="py-3 px-4"><ResourceRowActions onDelete={() => handleDelete(m.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Machine">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Name *" placeholder="e.g. FACS Aria III" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Model" placeholder="Model number or description" value={model} onChange={(e) => setModel(e.target.value)} />
          <Select label="Status" options={STATUS_OPTIONS} value={status} onChange={(v) => setStatus(v as Machine['status'])} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving}>Add Machine</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
