'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CalendarEvent, CalendarEventInsert, EventColor } from '../types'

export function useCalendarEvents(rangeStart: Date, rangeEnd: Date) {
  const startKey = rangeStart.toISOString().slice(0, 10)
  const endKey   = rangeEnd.toISOString().slice(0, 10)

  const [events,  setEvents]  = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()

      const { data: orgId, error: orgErr } = await supabase.rpc('get_my_org_id')
      if (orgErr || !orgId) throw new Error('Impossible de récupérer l\'organisation')

      // ISO range with one extra day on each side to catch edge cases
      const from = new Date(rangeStart)
      from.setDate(from.getDate() - 1)
      const to = new Date(rangeEnd)
      to.setDate(to.getDate() + 1)

      // Fetch calendar events
      const { data: calEvents, error: calErr } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('org_id', orgId)
        .gte('start_at', from.toISOString())
        .lte('start_at', to.toISOString())
        .order('start_at')

      if (calErr) {
        // Table may not exist yet — degrade gracefully
        if (calErr.code !== '42P01') throw calErr
      }

      // Fetch experiments in date range (based on created_at)
      const { data: experiments, error: expErr } = await supabase
        .from('experiments')
        .select('id, name, project, created_at, protocol_id')
        .eq('org_id', orgId)
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString())

      if (expErr) throw expErr

      const combined: CalendarEvent[] = [
        ...((calEvents ?? []).map(e => ({
          id:            e.id,
          title:         e.title,
          description:   e.description,
          start_at:      e.start_at,
          end_at:        e.end_at,
          all_day:       e.all_day,
          color:         (e.color as EventColor) ?? 'orange',
          experiment_id: e.experiment_id,
          protocol_id:   e.protocol_id,
          location:      e.location,
          source:        'event' as const,
        }))),
        ...((experiments ?? []).map(exp => {
          const date = exp.created_at.slice(0, 10)
          return {
            id:            `exp-${exp.id}`,
            title:         exp.name,
            description:   exp.project ?? null,
            start_at:      `${date}T09:00:00`,
            end_at:        `${date}T10:00:00`,
            all_day:       false,
            color:         'green' as EventColor,
            experiment_id: exp.id,
            protocol_id:   exp.protocol_id ?? null,
            location:      null,
            source:        'experiment' as const,
          }
        })),
      ]

      setEvents(combined)
    } catch (e) {
      console.error('[useCalendarEvents]', e)
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startKey, endKey])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const createEvent = useCallback(async (data: CalendarEventInsert): Promise<CalendarEvent> => {
    const supabase = createClient()
    const { data: orgId } = await supabase.rpc('get_my_org_id')
    const { data: { user } } = await supabase.auth.getUser()
    if (!orgId || !user) throw new Error('Non authentifié')

    const { data: row, error } = await supabase
      .from('calendar_events')
      .insert({
        org_id:     orgId,
        user_id:    user.id,
        title:      data.title,
        description: data.description ?? null,
        start_at:   data.start_at,
        end_at:     data.end_at,
        all_day:    data.all_day ?? false,
        color:      data.color ?? 'orange',
        experiment_id: data.experiment_id ?? null,
        protocol_id:   data.protocol_id ?? null,
        location:   data.location ?? null,
      })
      .select()
      .single()

    if (error) throw error
    await fetchEvents()
    return {
      id:            row.id,
      title:         row.title,
      description:   row.description,
      start_at:      row.start_at,
      end_at:        row.end_at,
      all_day:       row.all_day,
      color:         (row.color as EventColor) ?? 'orange',
      experiment_id: row.experiment_id,
      protocol_id:   row.protocol_id,
      location:      row.location,
      source:        'event',
    }
  }, [fetchEvents])

  const updateEvent = useCallback(async (id: string, data: Partial<CalendarEventInsert>) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('calendar_events')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    await fetchEvents()
  }, [fetchEvents])

  const deleteEvent = useCallback(async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
    if (error) throw error
    await fetchEvents()
  }, [fetchEvents])

  return { events, loading, error, refetch: fetchEvents, createEvent, updateEvent, deleteEvent }
}
