'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/nb/Button'
import Input from '@/components/ui/nb/Input'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Machine, Reagent } from '@/lib/supabase/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  timing: z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface ProtocolFormProps {
  mode: 'create' | 'edit'
  protocolId?: string
  defaultValues?: Partial<FormData & { machine_ids: string[]; reagent_ids: string[] }>
  machines: Machine[]
  reagents: Reagent[]
  orgId: string
  userId: string
}

export default function ProtocolForm({ mode, protocolId, defaultValues, machines, reagents, orgId, userId }: ProtocolFormProps) {
  const router = useRouter()
  const [selectedMachines, setSelectedMachines] = useState<string[]>(defaultValues?.machine_ids ?? [])
  const [selectedReagents, setSelectedReagents] = useState<string[]>(defaultValues?.reagent_ids ?? [])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: defaultValues?.name ?? '', timing: defaultValues?.timing ?? '' },
  })

  const toggleMachine = (id: string) =>
    setSelectedMachines((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id])

  const toggleReagent = (id: string) =>
    setSelectedReagents((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id])

  const onSubmit = async (data: FormData) => {
    const supabase = createClient()

    const upsertData = {
      id: protocolId,
      name: data.name,
      timing: data.timing ? data.timing : null,
      owner_id: userId,
      org_id: orgId,
    }

    const { data: protocol, error } = await supabase
      .from('protocols')
      .upsert(upsertData)
      .select('id')
      .single()

    if (error) { toast.error('Failed to save protocol'); return }

    // Replace junction rows
    await supabase.from('protocol_machines').delete().eq('protocol_id', protocol.id)
    await supabase.from('protocol_reagents').delete().eq('protocol_id', protocol.id)

    if (selectedMachines.length > 0) {
      await supabase.from('protocol_machines').insert(
        selectedMachines.map((machine_id) => ({ protocol_id: protocol.id, machine_id }))
      )
    }
    if (selectedReagents.length > 0) {
      await supabase.from('protocol_reagents').insert(
        selectedReagents.map((reagent_id) => ({ protocol_id: protocol.id, reagent_id }))
      )
    }

    toast.success(mode === 'create' ? 'Protocol created' : 'Protocol updated')
    router.push('/protocols')
    router.refresh()
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/protocols">
          <button className="flex items-center gap-1.5 text-[13px] text-nb-muted hover:text-nb-charcoal transition-colors mb-4">
            <ArrowLeft size={14} strokeWidth={1.5} />
            Protocols
          </button>
        </Link>
        <h1 className="text-[22px] font-[700] text-nb-charcoal">
          {mode === 'create' ? 'New Protocol' : 'Edit Protocol'}
        </h1>
      </div>

      <div className="bg-white border border-nb-cream-border rounded-[8px] p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-[560px]">
          <Input
            label="Protocol Name *"
            placeholder="e.g. Western Blot Standard"
            {...register('name')}
            error={!!errors.name}
            errorMessage={errors.name?.message}
          />
          <Input
            label="Duration"
            placeholder="e.g. 2h 30min"
            {...register('timing')}
            hint="Free text format: 2h 30min, 45min, etc."
          />

          {/* Machines */}
          <div>
            <p className="text-[13px] font-[600] text-nb-charcoal mb-3">Machines used</p>
            {machines.length === 0 ? (
              <p className="text-[13px] text-nb-muted">
                No machines yet.{' '}
                <Link href="/resources" className="text-nb-green hover:underline">Add machines first.</Link>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {machines.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMachine(m.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-[13px] border transition-all duration-150 font-nb-mono',
                      selectedMachines.includes(m.id)
                        ? 'bg-nb-green text-white border-nb-green'
                        : 'bg-white text-nb-charcoal border-nb-cream-border hover:border-nb-green'
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reagents */}
          <div>
            <p className="text-[13px] font-[600] text-nb-charcoal mb-3">Reagents used</p>
            {reagents.length === 0 ? (
              <p className="text-[13px] text-nb-muted">
                No reagents yet.{' '}
                <Link href="/resources" className="text-nb-green hover:underline">Add reagents first.</Link>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {reagents.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleReagent(r.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-[13px] border transition-all duration-150 font-nb-mono',
                      selectedReagents.includes(r.id)
                        ? 'bg-nb-green text-white border-nb-green'
                        : 'bg-white text-nb-charcoal border-nb-cream-border hover:border-nb-green'
                    )}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-nb-cream-border">
            <Link href="/protocols">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {mode === 'create' ? 'Create protocol' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
