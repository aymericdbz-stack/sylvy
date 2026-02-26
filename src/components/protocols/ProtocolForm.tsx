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
import Textarea from '@/components/ui/nb/Textarea'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Machine, Reagent } from '@/lib/supabase/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  timing: z.string().optional().nullable(),
  content: z.string().min(1, 'Protocol content is required'),
})

type FormData = z.infer<typeof schema>

const PROTOCOL_TEMPLATES: Array<{ id: string; label: string; description?: string; content: string }> = [
  {
    id: 'blank',
    label: 'Start from scratch',
    description: 'Empty template',
    content: '',
  },
  {
    id: 'elisa',
    label: 'ELISA assay (general)',
    content: [
      'Method',
      '',
      '1. Dilute the antigen to a final concentration of 10 µg/mL in bicarbonate/carbonate coating buffer.',
      '2. Pipette 100 µL of the antigen dilution into a PVC microtiter plate to coat the wells. Perform serial dilutions of the antigen down the plate if needed.',
      '3. Seal the plate with adhesive plastic and incubate at 4 °C overnight or at room temperature for 2 hours.',
      '4. Wash the plate 3 times with wash solution.',
      '5. Add 200 µL blocking buffer (e.g. 5% non‑fat dry milk in PBS) per well to block remaining protein‑binding sites.',
      '6. Cover the plate with adhesive plastic and incubate for at least 2 hours at room temperature or overnight at 4 °C.',
      '7. Wash the plate twice with wash solution.',
      '8. Add 100 µL of the primary antibody diluted to the optimal concentration (per manufacturer datasheet) in blocking buffer, prepared immediately before use.',
      '9. Cover the plate with adhesive plastic and incubate for 2 hours at room temperature.',
      '10. Wash the plate 5 times with wash solution.',
      '11. Using a multichannel pipette, dispense 50–100 µL of the substrate solution per well.',
      '12. After sufficient color development, add 50–100 µL of stop solution to each well.',
    ].join('\n'),
  },
  {
    id: 'western-blot',
    label: 'Western blot (basic)',
    content: [
      'Method',
      '',
      '1. Lyse cells or tissue in appropriate lysis buffer and clarify lysates by centrifugation.',
      '2. Determine protein concentration and dilute samples in SDS sample buffer; boil at 95 °C for 5 minutes.',
      '3. Load equal amounts of protein and molecular weight marker onto an SDS‑PAGE gel and run until adequate separation is achieved.',
      '4. Transfer proteins from the gel to a PVDF or nitrocellulose membrane using wet or semi‑dry transfer conditions.',
      '5. Block the membrane in blocking buffer (e.g. 5% non‑fat dry milk in TBST) for 1 hour at room temperature.',
      '6. Incubate the membrane with primary antibody diluted in blocking buffer for 1–2 hours at room temperature or overnight at 4 °C.',
      '7. Wash the membrane 3 × 5 minutes with TBST.',
      '8. Incubate with species‑appropriate HRP‑ or fluorophore‑conjugated secondary antibody diluted in blocking buffer for 1 hour at room temperature.',
      '9. Wash the membrane 3–5 × 5 minutes with TBST.',
      '10. Develop using appropriate detection reagent (e.g. ECL) and image the membrane.',
    ].join('\n'),
  },
  {
    id: 'pcr',
    label: 'PCR amplification',
    content: [
      'Method',
      '',
      '1. Prepare a master mix on ice containing buffer, MgCl₂ (if required), dNTPs, forward and reverse primers, DNA polymerase, and nuclease‑free water.',
      '2. Aliquot the master mix into PCR tubes or a PCR plate and add template DNA to each reaction.',
      '3. Place tubes in a thermocycler and run the following program (example):',
      '   • Initial denaturation: 95 °C for 2–3 minutes',
      '   • 30–35 cycles of:',
      '       – Denaturation: 95 °C for 30 seconds',
      '       – Annealing: primer‑specific temperature for 30 seconds',
      '       – Extension: 72 °C for 30 seconds per kb',
      '   • Final extension: 72 °C for 5–10 minutes',
      '4. Hold at 4 °C and store products at −20 °C if needed.',
      '5. Analyze PCR products by agarose gel electrophoresis.',
    ].join('\n'),
  },
  {
    id: 'cell-culture',
    label: 'Cell culture passaging',
    content: [
      'Method',
      '',
      '1. Warm complete culture medium and trypsin (or dissociation reagent) to 37 °C.',
      '2. Aspirate spent medium from the flask and gently rinse cells with pre‑warmed PBS if required.',
      '3. Add sufficient trypsin to cover the cell layer and incubate at 37 °C until cells detach (typically 2–5 minutes).',
      '4. Neutralize trypsin with an equal or greater volume of complete medium and gently resuspend cells.',
      '5. Transfer the cell suspension to a conical tube and determine cell number and viability if needed.',
      '6. Seed the desired number of cells into new culture vessels containing pre‑warmed complete medium.',
      '7. Incubate cells at 37 °C, 5% CO₂ (or appropriate conditions) and replace medium as required.',
    ].join('\n'),
  },
  {
    id: 'flow-cytometry',
    label: 'Flow cytometry staining',
    content: [
      'Method',
      '',
      '1. Prepare a single‑cell suspension in staining buffer (e.g. PBS + 1% BSA).',
      '2. Count cells and aliquot the required number per tube or well (typically 1–5 × 10⁵ cells).',
      '3. (Optional) Incubate cells with Fc‑block reagent for 10–15 minutes on ice.',
      '4. Add fluorophore‑conjugated antibodies at the recommended dilution and incubate for 20–30 minutes protected from light at 4 °C.',
      '5. Wash cells 1–2 times with staining buffer and resuspend in an appropriate volume for acquisition.',
      '6. (Optional) Add viability dye according to manufacturer instructions.',
      '7. Filter suspensions through a cell strainer and acquire samples on the flow cytometer using suitable instrument settings.',
    ].join('\n'),
  },
]

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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      timing: defaultValues?.timing ?? '',
      content: (defaultValues as any)?.content ?? '',
    },
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
      content: data.content ?? null,
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

          {/* Equipment */}
          <div>
            <p className="text-[13px] font-[600] text-nb-charcoal mb-3">Equipment used</p>
            {machines.length === 0 ? (
              <p className="text-[13px] text-nb-muted">
                No equipment yet.{' '}
                <Link href="/resources" className="text-nb-green hover:underline">Add equipment first.</Link>
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

          {/* Protocol content + templates */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-[600] text-nb-charcoal">Protocol content</p>
              <span className="text-[11px] text-nb-muted">Write or start from a template</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {PROTOCOL_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(tpl.id)
                    setValue('content', tpl.content, { shouldDirty: true, shouldValidate: true })
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-[12px] border transition-all duration-150 font-nb-mono',
                    selectedTemplateId === tpl.id
                      ? 'bg-nb-green text-white border-nb-green'
                      : 'bg-white text-nb-charcoal border-nb-cream-border hover:border-nb-green'
                  )}
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            <Textarea
              label="Protocol text *"
              placeholder="Write out the full protocol steps, including preparation, incubation conditions, and notes..."
              {...register('content')}
              error={!!errors.content}
              errorMessage={errors.content?.message}
              className="min-h-[220px]"
            />
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
