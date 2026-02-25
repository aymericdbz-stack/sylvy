'use client'

import { useState, useRef, useEffect } from 'react'
import { SendHorizonal, RotateCcw, Loader2, CalendarPlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/pl/Button'
import ScheduleView from '../ScheduleView'
import type {
  PlannerResponse, ApiCalendar, ApiComments, Schedule, ScheduledTask, ChatMessage, CalendarEventInsert,
} from '../types'

// ── Transform AI calendar → Schedule (for ScheduleView preview) ──────────────
function minuteDiff(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(1, (eh * 60 + em) - (sh * 60 + sm))
}

function toSchedule(cal: ApiCalendar, comments?: ApiComments): Schedule {
  const tasks: ScheduledTask[] = cal.days.flatMap(day =>
    day.blocks.map((b, i) => ({
      id:           `${day.date}-${i}`,
      title:        b.title,
      date:         day.date,
      start_time:   b.start,
      end_time:     b.end,
      duration_min: minuteDiff(b.start, b.end),
      priority:     'medium' as const,
      category:     'other'  as const,
      notes:        b.notes || undefined,
      protocol_id:  b.protocol_id ?? undefined,
      parallel_with: [],
    }))
  )
  const firstDate  = cal.days[0]?.date ?? new Date().toISOString().slice(0, 10)
  const total      = tasks.reduce((s, t) => s + t.duration_min, 0)
  return { date: firstDate, total_duration_min: total, tasks, summary: comments?.summary ?? '', warnings: comments?.assumptions ?? [] }
}

// Convert AI schedule to CalendarEventInsert[]
function scheduleToEvents(schedule: Schedule): CalendarEventInsert[] {
  return schedule.tasks.map(t => ({
    title:       t.title,
    description: t.notes ?? null,
    start_at:    `${t.date ?? schedule.date}T${t.start_time}:00`,
    end_at:      `${t.date ?? schedule.date}T${t.end_time}:00`,
    all_day:     false,
    color:       'blue' as const,
    protocol_id: t.protocol_id ?? null,
  }))
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface AiAssistPanelProps {
  onAddToCalendar: (events: CalendarEventInsert[]) => Promise<void>
  onClose:         () => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AiAssistPanel({ onAddToCalendar, onClose }: AiAssistPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [adding,   setAdding]   = useState<number | null>(null)
  const endRef      = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id

      const res = await fetch(`${process.env.NEXT_PUBLIC_PLANNER_API_URL}/v1/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'X-User-Id': userId } : {}),
        },
        body: JSON.stringify({ input_text: text }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? `API error ${res.status}`)
      }

      const data: PlannerResponse = await res.json()

      const assistantMsg: ChatMessage =
        data.status === 'need_more_info'
          ? { role: 'assistant', content: data.question ?? '' }
          : {
              role:     'assistant',
              content:  data.comments?.summary ?? '',
              schedule: data.calendar ? toSchedule(data.calendar, data.comments) : undefined,
            }

      setMessages([...newMessages, assistantMsg])
    } catch (e) {
      setMessages([...newMessages, {
        role:    'assistant',
        content: e instanceof Error ? e.message : 'Erreur inattendue',
        isError: true,
      }])
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }

  async function handleAddToCalendar(schedule: Schedule, msgIndex: number) {
    const events = scheduleToEvents(schedule)
    setAdding(msgIndex)
    try {
      await onAddToCalendar(events)
    } finally {
      setAdding(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full bg-pl-cream-dark border-l border-pl-cream-border">

      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-pl-cream-border flex-shrink-0">
        <div>
          <p className="text-[12px] font-[700] text-pl-charcoal font-nb-mono">Assistant IA</p>
          <p className="text-[10px] text-pl-muted font-nb-mono">Décris tes expériences, je planifie</p>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-1 text-pl-muted hover:text-pl-charcoal transition-colors"
              title="Nouvelle conversation"
            >
              <RotateCcw size={13} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-pl-muted hover:text-pl-charcoal transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-6 space-y-2">
            <p className="text-[12px] font-[600] text-pl-charcoal font-nb-mono">Décris tes tâches de labo</p>
            <p className="text-[11px] text-pl-muted font-nb-mono leading-relaxed">
              Ex : « western blot sur 6 échantillons, préparer les cultures »
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="max-w-[85%] bg-pl-orange text-white rounded-[8px] rounded-tr-[3px] px-3 py-2 text-[12px] font-nb-mono leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>
            ) : (
              <div className="w-full space-y-2">
                {msg.content && (
                  <div className={`text-[12px] font-nb-mono leading-relaxed px-3 py-2 rounded-[8px] rounded-tl-[3px] ${
                    msg.isError
                      ? 'bg-red-50 text-pl-error border border-red-200'
                      : 'bg-white border border-pl-cream-border text-pl-charcoal'
                  }`}>
                    {msg.content}
                  </div>
                )}
                {msg.schedule && (
                  <div className="space-y-2">
                    <div className="overflow-hidden rounded-[6px] border border-pl-cream-border bg-white">
                      <ScheduleView schedule={msg.schedule} />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={adding === i}
                      onClick={() => handleAddToCalendar(msg.schedule!, i)}
                      className="w-full"
                    >
                      <CalendarPlus size={12} />
                      Ajouter au calendrier
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-pl-cream-border rounded-[8px] rounded-tl-[3px] px-3 py-2">
              <div className="flex items-center gap-2 text-[11px] text-pl-muted font-nb-mono">
                <Loader2 size={11} className="animate-spin" />
                Planification en cours…
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-pl-cream-border px-4 py-3 bg-pl-cream">
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input) }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 100)}px`
            }}
            placeholder="Décris tes tâches… (Entrée pour envoyer)"
            disabled={loading}
            rows={1}
            className="flex-1 resize-none bg-white border border-pl-cream-border rounded-[6px] px-3 py-2 text-[12px] text-pl-charcoal font-nb-mono placeholder:text-pl-muted-light focus:outline-none focus:ring-1 focus:ring-pl-orange/40 disabled:opacity-50 leading-relaxed"
            style={{ maxHeight: '100px', overflowY: 'auto' }}
          />
          <Button type="submit" size="sm" loading={loading} disabled={!input.trim()}>
            <SendHorizonal size={13} />
          </Button>
        </form>
      </div>

    </div>
  )
}
