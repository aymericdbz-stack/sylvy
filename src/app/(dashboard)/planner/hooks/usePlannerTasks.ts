'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'

export interface StepData {
  id: string
  name: string
  duration: number      // minutes
  startOffset: number   // minutes from task start (T+)
}

export interface PlannerTask {
  id: string
  user_id: string
  name: string
  deadline: string | null
  steps: StepData[]
  scheduled_start: string | null
  color: string | null
  conflict: boolean
  conflict_reason: string | null
  created_at: string
}

export interface PlannerTaskInsert {
  name: string
  deadline?: string | null
  steps: StepData[]
  color?: string | null
}

const TASK_COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#14B8A6', '#EF4444', '#4CAF7D']
let colorIdx = 0
function nextColor(): string {
  const c = TASK_COLORS[colorIdx % TASK_COLORS.length]
  colorIdx++
  return c
}

export function usePlannerTasks() {
  const [tasks,   setTasks]   = useState<PlannerTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [dirty,   setDirty]   = useState(false) // true when tasks changed since last optimize

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error: err } = await supabase
        .from('planner_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (err) throw err

      setTasks((data ?? []).map(row => ({
        ...row,
        steps: (row.steps as unknown as StepData[]) ?? [],
      })))
    } catch (e) {
      console.error('[usePlannerTasks]', e)
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const createTask = useCallback(async (data: PlannerTaskInsert) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const { error } = await supabase
      .from('planner_tasks')
      .insert({
        user_id:  user.id,
        name:     data.name,
        deadline: data.deadline ?? null,
        steps:    data.steps as unknown as Json,
        color:    data.color ?? nextColor(),
      })

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
          conflict: u.conflict,
          conflict_reason: u.conflict_reason,
        })
        .eq('id', u.id)
      if (error) throw error
    }
    setDirty(false)
    await fetchTasks()
  }, [fetchTasks])

  return { tasks, loading, error, dirty, setDirty, refetch: fetchTasks, createTask, deleteTask, bulkUpdateSchedule }
}
