'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate, isExpiringSoon } from '@/lib/utils'
import Button from '@/components/ui/nb/Button'
import Modal from '@/components/ui/nb/Modal'
import Input from '@/components/ui/nb/Input'
import ResourceRowActions from './ResourceRowActions'
import { cn } from '@/lib/utils'
import type { Reagent } from '@/lib/supabase/types'

export default function ReagentsTab({ orgId }: { orgId: string }) {
  const [reagents, setReagents] = useState<Reagent[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [supplier, setSupplier] = useState('')
  const [location, setLocation] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('reagents').select('*').eq('org_id', orgId).order('created_at', { ascending: false })
    setReagents(data ?? [])
  }, [orgId])

  useEffect(() => { load() }, [load])

  const resetForm = () => { setName(''); setSupplier(''); setLocation(''); setExpirationDate('') }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('reagents').insert({
      name: name.trim(),
      supplier: supplier || null,
      location: location || null,
      expiration_date: expirationDate || null,
      org_id: orgId,
    })
    if (error) { toast.error('Failed to create reagent'); setSaving(false); return }
    toast.success('Reagent added')
    resetForm(); setModalOpen(false); load(); setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('reagents').delete().eq('id', id)
    toast.success('Reagent deleted')
    load()
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} strokeWidth={1.5} /> Add Reagent
        </Button>
      </div>

      {reagents.length === 0 ? (
        <div className="text-center py-16 font-nb-mono">
          <FlaskConical size={40} strokeWidth={1} className="mx-auto mb-3 text-nb-muted-light" />
          <p className="text-[13px] text-nb-muted">No reagents yet. Add your first reagent.</p>
        </div>
      ) : (
        <div className="bg-white border border-nb-cream-border rounded-[8px] overflow-hidden font-nb-mono">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-nb-cream-border bg-nb-cream">
                {['Name', 'Supplier', 'Location', 'Expires', 'Created', ''].map((h) => (
                  <th key={h} className="text-[11px] font-[600] uppercase tracking-[0.04em] text-nb-muted py-2.5 px-4 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reagents.map((r) => (
                <tr key={r.id} className="border-b border-nb-cream-border last:border-0 hover:bg-nb-cream transition-colors">
                  <td className="py-3 px-4 text-[13px] font-[600] text-nb-charcoal">{r.name}</td>
                  <td className="py-3 px-4 text-[13px] text-nb-muted">{r.supplier ?? '—'}</td>
                  <td className="py-3 px-4 text-[13px] text-nb-muted">{r.location ?? '—'}</td>
                  <td className={cn('py-3 px-4 text-[13px]', isExpiringSoon(r.expiration_date) ? 'text-nb-error font-[600]' : 'text-nb-muted')}>
                    {r.expiration_date ? formatDate(r.expiration_date) : '—'}
                  </td>
                  <td className="py-3 px-4 text-[13px] text-nb-muted">{formatDate(r.created_at)}</td>
                  <td className="py-3 px-4"><ResourceRowActions onDelete={() => handleDelete(r.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Reagent">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Name *" placeholder="e.g. Anti-CD3 antibody" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Supplier" placeholder="e.g. Sigma-Aldrich" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          <Input label="Storage location" placeholder="e.g. -80°C Freezer B3" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Input label="Expiration date" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving}>Add Reagent</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
