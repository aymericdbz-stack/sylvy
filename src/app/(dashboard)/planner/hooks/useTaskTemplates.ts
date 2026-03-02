'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'
import type { StepData } from './usePlannerTasks'

export interface TaskTemplate {
  id:         string
  user_id:    string
  name:       string
  color:      string | null
  steps:      StepData[]
  created_at: string
}

export interface TaskTemplateInsert {
  name:   string
  color?: string | null
  steps:  StepData[]
}

/** Parse raw JSONB step */
function parseStep(raw: unknown): StepData {
  const s = raw as Record<string, unknown>
  return {
    id:          String(s.id ?? crypto.randomUUID()),
    name:        String(s.name ?? ''),
    description: String(s.description ?? ''),
    duration:    Number(s.duration ?? 30),
    startOffset: Number(s.startOffset ?? 0),
  }
}

export function useTaskTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: err } = await supabase
        .from('task_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (err) throw err

      setTemplates((data ?? []).map(row => ({
        ...row,
        steps: ((row.steps as unknown[]) ?? []).map(parseStep),
      })))
    } catch (e) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? JSON.stringify(e)
      console.error('[useTaskTemplates]', msg, e)
      setError(msg || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const createTemplate = useCallback(async (data: TaskTemplateInsert) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('task_templates')
      .insert({
        user_id: user.id,
        name:    data.name,
        color:   data.color ?? null,
        steps:   data.steps as unknown as Json,
      })

    if (error) throw error
    await fetchTemplates()
  }, [fetchTemplates])

  const updateTemplate = useCallback(async (id: string, data: TaskTemplateInsert) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('task_templates')
      .update({
        name:  data.name,
        color: data.color ?? null,
        steps: data.steps as unknown as Json,
      })
      .eq('id', id)
    if (error) throw error
    await fetchTemplates()
  }, [fetchTemplates])

  const deleteTemplate = useCallback(async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', id)
    if (error) throw error
    await fetchTemplates()
  }, [fetchTemplates])

  return { templates, loading, error, refetch: fetchTemplates, createTemplate, updateTemplate, deleteTemplate }
}
