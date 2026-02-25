'use client'

import { useState, useMemo, useRef } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import CalendarHeader              from './components/CalendarHeader'
import WeekCalendar, { getMondayOf } from './components/WeekCalendar'
import MonthCalendar               from './components/MonthCalendar'
import EventModal                  from './components/EventModal'
import AiAssistPanel               from './components/AiAssistPanel'
import SyncMenu                    from './components/SyncMenu'
import { useCalendarEvents }        from './hooks/useCalendarEvents'

import type {
  CalendarView,
  CalendarEvent,
  CalendarEventInsert,
} from './types'

// ── Date helpers ──────────────────────────────────────────────────────────────
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d); r.setMonth(r.getMonth() + n); return r
}

// Range for fetching events — full month + buffer for week view
function getRangeForView(view: CalendarView, current: Date): { start: Date; end: Date } {
  if (view === 'week') {
    const monday = getMondayOf(current)
    return { start: addDays(monday, -14), end: addDays(monday, 42) }
  }
  // month: fetch ±2 months
  const start = new Date(current.getFullYear(), current.getMonth() - 1, 1)
  const end   = new Date(current.getFullYear(), current.getMonth() + 2, 1)
  return { start, end }
}

// Events in current week (for sync export)
function getWeekEvents(events: CalendarEvent[], monday: Date): CalendarEvent[] {
  const sunday = addDays(monday, 6)
  const sISO   = monday.toISOString().slice(0, 10)
  const eISO   = sunday.toISOString().slice(0, 10)
  return events.filter(ev => {
    const d = ev.start_at.slice(0, 10)
    return d >= sISO && d <= eISO
  })
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PlannerClient() {
  const [view,        setView]        = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState<Date>(() => getMondayOf(new Date()))
  const [aiOpen,      setAiOpen]      = useState(false)
  const [syncOpen,    setSyncOpen]    = useState(false)

  // Modal state
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editEvent,   setEditEvent]   = useState<CalendarEvent | null>(null)
  const [slotDate,    setSlotDate]    = useState<string | undefined>()
  const [slotTime,    setSlotTime]    = useState<string | undefined>()

  const syncRef = useRef<HTMLDivElement>(null)

  // Data
  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getRangeForView(view, currentDate),
    [view, currentDate]
  )
  const { events, loading, error, createEvent, updateEvent, deleteEvent } =
    useCalendarEvents(rangeStart, rangeEnd)

  const monday   = getMondayOf(currentDate)
  const weekEvts = getWeekEvents(events, monday)

  // ── Navigation ──────────────────────────────────────────────────────────────
  function handlePrev() {
    setCurrentDate(d => view === 'week' ? addDays(d, -7) : addMonths(d, -1))
  }
  function handleNext() {
    setCurrentDate(d => view === 'week' ? addDays(d, 7) : addMonths(d, 1))
  }
  function handleToday() {
    if (view === 'week') setCurrentDate(getMondayOf(new Date()))
    else setCurrentDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  }
  function handleViewChange(v: CalendarView) {
    setView(v)
    if (v === 'month') {
      setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), 1))
    } else {
      setCurrentDate(getMondayOf(new Date()))
    }
  }

  // ── Event interaction ────────────────────────────────────────────────────────
  function handleEventClick(event: CalendarEvent) {
    setEditEvent(event)
    setSlotDate(undefined)
    setSlotTime(undefined)
    setModalOpen(true)
  }

  function handleSlotClick(date: string, time: string) {
    setEditEvent(null)
    setSlotDate(date)
    setSlotTime(time)
    setModalOpen(true)
  }

  function handleDayClick(date: string) {
    setCurrentDate(getMondayOf(new Date(date + 'T00:00:00')))
    setView('week')
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────
  async function handleSave(data: CalendarEventInsert) {
    try {
      if (editEvent && editEvent.source === 'event') {
        await updateEvent(editEvent.id, data)
        toast.success('Événement mis à jour')
      } else {
        await createEvent(data)
        toast.success('Événement créé')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
      throw e
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEvent(id)
      toast.success('Événement supprimé')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
      throw e
    }
  }

  async function handleAddToCalendar(eventsToAdd: CalendarEventInsert[]) {
    try {
      for (const ev of eventsToAdd) await createEvent(ev)
      const n = eventsToAdd.length
      toast.success(`${n} événement${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'ajout')
      throw e
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="pl-app -mx-10 -my-8 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

      {/* Header */}
      <div className="relative flex-shrink-0">
        <CalendarHeader
          view={view}
          currentDate={currentDate}
          events={events}
          aiOpen={aiOpen}
          onViewChange={handleViewChange}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onAiToggle={() => setAiOpen(v => !v)}
          onSyncOpen={() => setSyncOpen(v => !v)}
        />

        {/* Sync dropdown */}
        <div ref={syncRef} className="absolute right-[88px] top-full z-40">
          <SyncMenu
            open={syncOpen}
            events={events}
            weekEvents={weekEvts}
            onClose={() => setSyncOpen(false)}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Calendar */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {loading && events.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-pl-muted font-nb-mono text-[12px]">
              <Loader2 size={16} className="animate-spin mr-2" />
              Chargement…
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-pl-muted font-nb-mono text-[12px] px-8 text-center">
              <p className="text-pl-error text-[13px] font-[600]">Erreur Supabase</p>
              <p className="text-[11px] leading-relaxed text-pl-muted">
                La table <span className="font-[600] text-pl-charcoal">calendar_events</span> n&apos;existe pas encore.
                Exécute la migration SQL pour activer la persistance.
              </p>
            </div>
          ) : view === 'week' ? (
            <WeekCalendar
              weekStart={getMondayOf(currentDate)}
              events={events}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
            />
          ) : (
            <MonthCalendar
              month={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          )}
        </div>

        {/* AI assist panel */}
        {aiOpen && (
          <div className="w-[360px] flex-shrink-0 flex flex-col overflow-hidden">
            <AiAssistPanel
              onAddToCalendar={handleAddToCalendar}
              onClose={() => setAiOpen(false)}
            />
          </div>
        )}

      </div>

      {/* FAB */}
      <button
        onClick={() => {
          setEditEvent(null)
          setSlotDate(new Date().toISOString().slice(0, 10))
          setSlotTime('09:00')
          setModalOpen(true)
        }}
        className="fixed right-8 bottom-8 z-30 w-11 h-11 rounded-full bg-pl-orange text-white shadow-lg flex items-center justify-center hover:bg-pl-orange-dark transition-colors"
        title="Nouvel événement"
      >
        <Plus size={20} />
      </button>

      {/* Event modal */}
      <EventModal
        open={modalOpen}
        event={editEvent}
        initialDate={slotDate}
        initialTime={slotTime}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => { setModalOpen(false); setEditEvent(null) }}
      />

    </div>
  )
}
