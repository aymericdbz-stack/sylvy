// ── Old Schedule types (used by ScheduleView / WeekView) ─────────────────────

export interface ScheduledTask {
  id: string
  title: string
  date?: string
  start_time: string
  end_time: string
  duration_min: number
  protocol_id?: string
  protocol_name?: string
  notes?: string
  parallel_with?: string[]
  priority: 'high' | 'medium' | 'low'
  category: 'assay' | 'culture' | 'admin' | 'prep' | 'other'
}

export interface Schedule {
  date: string
  total_duration_min: number
  tasks: ScheduledTask[]
  warnings?: string[]
  summary: string
}

// ── New API response types (POST /v1/plan) ────────────────────────────────────

export interface ApiCalendarBlock {
  start: string
  end: string
  title: string
  notes: string
  protocol_id?: string | null
}

export interface ApiCalendarDay {
  date: string
  blocks: ApiCalendarBlock[]
}

export interface ApiCalendar {
  days: ApiCalendarDay[]
}

export interface ApiComments {
  summary: string
  assumptions: string[]
}

export interface PlannerResponse {
  status: 'planned' | 'need_more_info'
  question?: string
  calendar?: ApiCalendar
  comments?: ApiComments
}

// ── Chat UI ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  schedule?: Schedule
  isError?: boolean
}

// ── Real Calendar types ───────────────────────────────────────────────────────

export type CalendarView = 'day' | 'week' | 'month' | 'year'

export type EventColor = 'orange' | 'green' | 'blue' | 'purple' | 'red' | 'teal'

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  start_at: string       // ISO datetime "2024-03-15T09:00:00"
  end_at: string         // ISO datetime "2024-03-15T10:30:00"
  all_day: boolean
  color: EventColor
  experiment_id?: string | null
  protocol_id?: string | null
  location?: string | null
  source: 'event' | 'experiment'
}

export interface CalendarEventInsert {
  title: string
  description?: string | null
  start_at: string
  end_at: string
  all_day?: boolean
  color?: EventColor
  experiment_id?: string | null
  protocol_id?: string | null
  location?: string | null
}
