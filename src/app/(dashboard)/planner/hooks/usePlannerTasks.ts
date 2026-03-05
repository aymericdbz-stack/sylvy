'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'
import { pickDistinctPlannerColor } from '../utils/colors'

export type Placement = 'manual' | 'auto'
export type Priority  = 'critical' | 'normal' | 'low'

export type FlexDir = '+' | '-' | '+/-'

export interface StepData {
  id:                string
  name:              string
  description:       string       // optional free-text notes for this step
  duration:          number       // minutes (min for +/+/-, max for -)
  startOffset:       number       // T+ minutes from task start (design-time)
  stepType:          'busy' | 'available'
  availableType:     'strict' | 'flexible'  // only relevant when stepType === 'available'
  flexibleDir?:      FlexDir      // '+' extend, '-' compress, '+/-' both; default '+'
  flexibleMax?:      number       // max extra minutes allowed; undefined = unlimited (snap to next work start)
  scheduledDuration?: number      // actual duration after flexible stretching (set by scheduler)
   overnight?:        boolean      // if true, this step is allowed to cross working-hours boundaries (overnight incubations)
}

export interface PlannerTask {
  id:              string
  user_id:         string
  name:            string
  description:     string | null
  priority:        Priority
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
  priority?:        Priority
  placement?:       Placement
  deadline?:        string | null
  steps:            StepData[]
  color?:           string | null
  scheduled_start?: string | null
}

function parseStep(raw: unknown): StepData {
  const s = raw as Record<string, unknown>
  const stepType = (s.stepType === 'available') ? 'available' as const : 'busy' as const
  return {
    id:               String(s.id ?? crypto.randomUUID()),
    name:             String(s.name ?? ''),
    description:      String(s.description ?? ''),
    duration:         Number(s.duration ?? 30),
    startOffset:      Number(s.startOffset ?? 0),
    stepType,
    availableType:    (s.availableType === 'strict') ? 'strict' : 'flexible',
    flexibleDir:      (['+'  , '-', '+/-'] as FlexDir[]).includes(s.flexibleDir as FlexDir)
                        ? (s.flexibleDir as FlexDir) : '+',
    flexibleMax:      s.flexibleMax != null ? Number(s.flexibleMax) : undefined,
    scheduledDuration: s.scheduledDuration != null ? Number(s.scheduledDuration) : undefined,
    overnight:        s.overnight === true,
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
        priority:  ((row as Record<string, unknown>).priority as Priority | undefined) ?? 'normal',
        placement: ((row as Record<string, unknown>).placement as Placement | undefined) ?? 'auto',
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

  /** Create a task and return its new ID. */
  const createTask = useCallback(async (data: PlannerTaskInsert): Promise<string> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Ensure each new task gets a color not already visible in the calendar.
    const usedColors = tasks.map(t => t.color)
    const color = pickDistinctPlannerColor(usedColors, data.color ?? null)

    const { data: row, error } = await supabase
      .from('planner_tasks')
      .insert({
        user_id:         user.id,
        name:            data.name,
        description:     data.description  ?? null,
        priority:        data.priority     ?? 'normal',
        placement:       data.placement    ?? 'auto',
        deadline:        data.deadline     ?? null,
        steps:           data.steps        as unknown as Json,
        color,
        scheduled_start: data.scheduled_start ?? null,
      })
      .select('id')
      .single()

    if (error) throw error
    setDirty(true)
    await fetchTasks()
    return (row as { id: string }).id
  }, [fetchTasks, tasks])

  const updateTask = useCallback(async (id: string, data: PlannerTaskInsert) => {
    // Optimistic update: move the task in UI immediately so drag-drop has no jerk
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      return {
        ...t,
        name:            data.name,
        description:     data.description ?? t.description,
        priority:        data.priority ?? t.priority,
        placement:       data.placement ?? t.placement,
        deadline:        data.deadline ?? t.deadline,
        steps:           data.steps,
        color:           data.color ?? t.color,
        scheduled_start: data.scheduled_start ?? t.scheduled_start,
      }
    }))

    const supabase = createClient()
    const { error } = await supabase
      .from('planner_tasks')
      .update({
        name:            data.name,
        description:     data.description  ?? null,
        priority:        data.priority     ?? 'normal',
        placement:       data.placement    ?? 'auto',
        deadline:        data.deadline     ?? null,
        steps:           data.steps        as unknown as Json,
        color:           data.color        ?? null,
        scheduled_start: data.scheduled_start ?? null,
      })
      .eq('id', id)
    if (error) {
      await fetchTasks()
      throw error
    }
    setDirty(true)
    // Don't fetchTasks after success: optimistic state is already correct.
    // Fetching can cause a jerk if DB read returns stale data before write is replicated.
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
    updates: {
      id:              string
      scheduled_start: string | null
      conflict:        boolean
      conflict_reason: string | null
      steps?:          StepData[]
    }[]
  ) => {
    // Optimistic update: move tasks in UI immediately so drag-drop has no jerk
    setTasks(prev => {
      const updateMap = new Map(updates.map(u => [u.id, u]))
      return prev.map(t => {
        const u = updateMap.get(t.id)
        if (!u) return t
        return {
          ...t,
          scheduled_start: u.scheduled_start ?? t.scheduled_start,
          conflict:        u.conflict,
          conflict_reason: u.conflict_reason ?? t.conflict_reason,
          steps:           u.steps ?? t.steps,
        }
      })
    })

    const supabase = createClient()
    for (const u of updates) {
      const payload: Record<string, unknown> = {
        scheduled_start: u.scheduled_start,
        conflict:        u.conflict,
        conflict_reason: u.conflict_reason,
      }
      if (u.steps) payload.steps = u.steps as unknown as Json
      const { error } = await supabase
        .from('planner_tasks')
        .update(payload)
        .eq('id', u.id)
      if (error) {
        await fetchTasks()
        throw error
      }
    }
    setDirty(false)
    // Don't fetchTasks after success: optimistic state is already correct.
  }, [fetchTasks])

  return {
    tasks, loading, error, dirty, setDirty,
    refetch: fetchTasks,
    createTask, updateTask, deleteTask, bulkUpdateSchedule,
  }
}
