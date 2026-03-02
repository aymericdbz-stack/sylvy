'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'

export type Placement = 'manual' | 'auto'

export interface StepData {
  id:          string
  name:        string
  description: string      // optional free-text notes for this step
  duration:    number      // minutes
  startOffset: number      // T+ minutes from task start
}

export interface PlannerTask {
  id:              string
  user_id:         string
  name:            string
  description:     string | null
  placement:       Placement
  deadline:        string | null
  steps:           StepData[]
  scheduled_start: string | null
  color:           string | null
  conflict:        boolean
  conflict_reason: string | null
  created_at:      string
}

export interface PlannerTaskInsert {
  name:             string
  description?:     string | null
  placement?:       Placement
  deadline?:        string | null
  steps:            StepData[]
  color?:           string | null
  scheduled_start?: string | null  // set by user when placement === 'manual'
}

const TASK_COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#14B8A6', '#EF4444', '#4CAF7D']
let colorIdx = 0
function nextColor(): string {
  const c = TASK_COLORS[colorIdx % TASK_COLORS.length]
  colorIdx++
  return c
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

export function usePlannerTasks() {
  const [tasks,   setTasks]   = useState<PlannerTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [dirty,   setDirty]   = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: err } = await supabase
        .from('planner_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (err) throw err

      setTasks((data ?? []).map(row => ({
        ...row,
        placement: (row.placement as Placement | undefined) ?? 'auto',
        steps:     ((row.steps as unknown[]) ?? []).map(parseStep),
      })))
    } catch (e) {
      console.error('[usePlannerTasks]', e)
      setError(e instanceof Error ? e.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const createTask = useCallback(async (data: PlannerTaskInsert) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('planner_tasks')
      .insert({
        user_id:         user.id,
        name:            data.name,
        description:     data.description ?? null,
        placement:       data.placement ?? 'auto',
        deadline:        data.deadline  ?? null,
        steps:           data.steps     as unknown as Json,
        color:           data.color     ?? nextColor(),
        scheduled_start: data.scheduled_start ?? null,
      })

    if (error) throw error
    setDirty(true)
    await fetchTasks()
  }, [fetchTasks])

  const updateTask = useCallback(async (id: string, data: PlannerTaskInsert) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('planner_tasks')
      .update({
        name:            data.name,
        description:     data.description ?? null,
        placement:       data.placement ?? 'auto',
        deadline:        data.deadline  ?? null,
        steps:           data.steps     as unknown as Json,
        color:           data.color     ?? null,
        scheduled_start: data.scheduled_start ?? null,
      })
      .eq('id', id)
    if (error) throw error
    setDirty(true)
    await fetchTasks()
  }, [fetchTasks])

  const deleteTask = useCallback(async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('planner_tasks')
      .delete()
      .eq('id', id)
    if (error) throw error
    setDirty(true)
    await fetchTasks()
  }, [fetchTasks])

  const bulkUpdateSchedule = useCallback(async (
    updates: { id: string; scheduled_start: string | null; conflict: boolean; conflict_reason: string | null }[]
  ) => {
    const supabase = createClient()
    for (const u of updates) {
      const { error } = await supabase
        .from('planner_tasks')
        .update({
          scheduled_start: u.scheduled_start,
          conflict:        u.conflict,
          conflict_reason: u.conflict_reason,
        })
        .eq('id', u.id)
      if (error) throw error
    }
    setDirty(false)
    await fetchTasks()
  }, [fetchTasks])

  return {
    tasks, loading, error, dirty, setDirty,
    refetch: fetchTasks,
    createTask, updateTask, deleteTask, bulkUpdateSchedule,
  }
}
