export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: { id?: string; name?: string; created_at?: string }
        Relationships: []
      }
      users: {
        Row: { id: string; org_id: string; email: string; role: 'admin' | 'member'; user_type: 'researcher' | 'lab_manager'; created_at: string }
        Insert: { id: string; org_id: string; email: string; role?: 'admin' | 'member'; user_type?: 'researcher' | 'lab_manager'; created_at?: string }
        Update: { id?: string; org_id?: string; email?: string; role?: 'admin' | 'member'; user_type?: 'researcher' | 'lab_manager'; created_at?: string }
        Relationships: [
          { foreignKeyName: 'users_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }
        ]
      }
      samples: {
        Row: { id: string; org_id: string; owner_id: string; name: string; description: string | null; created_at: string }
        Insert: { id?: string; org_id: string; owner_id: string; name: string; description?: string | null; created_at?: string }
        Update: { id?: string; org_id?: string; owner_id?: string; name?: string; description?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: 'samples_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'samples_owner_id_fkey'; columns: ['owner_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      machines: {
        Row: { id: string; org_id: string; name: string; model: string | null; status: 'active' | 'inactive' | 'maintenance'; created_at: string }
        Insert: { id?: string; org_id: string; name: string; model?: string | null; status?: 'active' | 'inactive' | 'maintenance'; created_at?: string }
        Update: { id?: string; org_id?: string; name?: string; model?: string | null; status?: 'active' | 'inactive' | 'maintenance'; created_at?: string }
        Relationships: [
          { foreignKeyName: 'machines_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }
        ]
      }
      reagents: {
        Row: { id: string; org_id: string; name: string; supplier: string | null; location: string | null; expiration_date: string | null; created_at: string }
        Insert: { id?: string; org_id: string; name: string; supplier?: string | null; location?: string | null; expiration_date?: string | null; created_at?: string }
        Update: { id?: string; org_id?: string; name?: string; supplier?: string | null; location?: string | null; expiration_date?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: 'reagents_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }
        ]
      }
      protocols: {
        Row: {
          id: string
          org_id: string
          owner_id: string
          name: string
          timing: string | null
          /** Full textual content of the protocol (methods, steps, etc.) */
          content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          owner_id: string
          name: string
          timing?: string | null
          /** Full textual content of the protocol (methods, steps, etc.) */
          content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          owner_id?: string
          name?: string
          timing?: string | null
          /** Full textual content of the protocol (methods, steps, etc.) */
          content?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'protocols_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'protocols_owner_id_fkey'; columns: ['owner_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      protocol_machines: {
        Row: { protocol_id: string; machine_id: string }
        Insert: { protocol_id: string; machine_id: string }
        Update: { protocol_id?: string; machine_id?: string }
        Relationships: [
          { foreignKeyName: 'protocol_machines_protocol_id_fkey'; columns: ['protocol_id']; isOneToOne: false; referencedRelation: 'protocols'; referencedColumns: ['id'] },
          { foreignKeyName: 'protocol_machines_machine_id_fkey'; columns: ['machine_id']; isOneToOne: false; referencedRelation: 'machines'; referencedColumns: ['id'] }
        ]
      }
      protocol_reagents: {
        Row: { protocol_id: string; reagent_id: string }
        Insert: { protocol_id: string; reagent_id: string }
        Update: { protocol_id?: string; reagent_id?: string }
        Relationships: [
          { foreignKeyName: 'protocol_reagents_protocol_id_fkey'; columns: ['protocol_id']; isOneToOne: false; referencedRelation: 'protocols'; referencedColumns: ['id'] },
          { foreignKeyName: 'protocol_reagents_reagent_id_fkey'; columns: ['reagent_id']; isOneToOne: false; referencedRelation: 'reagents'; referencedColumns: ['id'] }
        ]
      }
      report_templates: {
        Row: { id: string; org_id: string; owner_id: string; title: string; created_at: string; updated_at: string }
        Insert: { id?: string; org_id: string; owner_id: string; title: string; created_at?: string; updated_at?: string }
        Update: { id?: string; org_id?: string; owner_id?: string; title?: string; created_at?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: 'report_templates_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'report_templates_owner_id_fkey'; columns: ['owner_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      template_blocks: {
        Row: { id: string; template_id: string; order: number; type: 'heading' | 'text' | 'image_placeholder' | 'data_table'; content: string | null; created_at: string }
        Insert: { id?: string; template_id: string; order?: number; type: 'heading' | 'text' | 'image_placeholder' | 'data_table'; content?: string | null; created_at?: string }
        Update: { id?: string; template_id?: string; order?: number; type?: 'heading' | 'text' | 'image_placeholder' | 'data_table'; content?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: 'template_blocks_template_id_fkey'; columns: ['template_id']; isOneToOne: false; referencedRelation: 'report_templates'; referencedColumns: ['id'] }
        ]
      }
      projects: {
        Row: { id: string; org_id: string; owner_id: string; name: string; description: string | null; created_at: string }
        Insert: { id?: string; org_id: string; owner_id: string; name: string; description?: string | null; created_at?: string }
        Update: { id?: string; org_id?: string; owner_id?: string; name?: string; description?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: 'projects_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'projects_owner_id_fkey'; columns: ['owner_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      experiment_sets: {
        Row: { id: string; org_id: string; owner_id: string; project_id: string; name: string; created_at: string }
        Insert: { id?: string; org_id: string; owner_id: string; project_id: string; name: string; created_at?: string }
        Update: { id?: string; org_id?: string; owner_id?: string; project_id?: string; name?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: 'experiment_sets_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'experiment_sets_owner_id_fkey'; columns: ['owner_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'experiment_sets_project_id_fkey'; columns: ['project_id']; isOneToOne: false; referencedRelation: 'projects'; referencedColumns: ['id'] }
        ]
      }
      experiments: {
        Row: { id: string; org_id: string; owner_id: string; protocol_id: string | null; sample_id: string | null; report_template_id: string | null; experiment_set_id: string | null; name: string; project: string | null; created_at: string; last_edited_at: string }
        Insert: { id?: string; org_id: string; owner_id: string; protocol_id?: string | null; sample_id?: string | null; report_template_id?: string | null; experiment_set_id?: string | null; name: string; project?: string | null; created_at?: string; last_edited_at?: string }
        Update: { id?: string; org_id?: string; owner_id?: string; protocol_id?: string | null; sample_id?: string | null; report_template_id?: string | null; experiment_set_id?: string | null; name?: string; project?: string | null; created_at?: string; last_edited_at?: string }
        Relationships: [
          { foreignKeyName: 'experiments_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'experiments_owner_id_fkey'; columns: ['owner_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'experiments_protocol_id_fkey'; columns: ['protocol_id']; isOneToOne: false; referencedRelation: 'protocols'; referencedColumns: ['id'] },
          { foreignKeyName: 'experiments_sample_id_fkey'; columns: ['sample_id']; isOneToOne: false; referencedRelation: 'samples'; referencedColumns: ['id'] },
          { foreignKeyName: 'experiments_report_template_id_fkey'; columns: ['report_template_id']; isOneToOne: false; referencedRelation: 'report_templates'; referencedColumns: ['id'] },
          { foreignKeyName: 'experiments_experiment_set_id_fkey'; columns: ['experiment_set_id']; isOneToOne: false; referencedRelation: 'experiment_sets'; referencedColumns: ['id'] }
        ]
      }
      experiment_files: {
        Row: { id: string; experiment_id: string; file_name: string; file_type: string; storage_url: string; uploaded_at: string }
        Insert: { id?: string; experiment_id: string; file_name: string; file_type: string; storage_url: string; uploaded_at?: string }
        Update: { id?: string; experiment_id?: string; file_name?: string; file_type?: string; storage_url?: string; uploaded_at?: string }
        Relationships: [
          { foreignKeyName: 'experiment_files_experiment_id_fkey'; columns: ['experiment_id']; isOneToOne: false; referencedRelation: 'experiments'; referencedColumns: ['id'] }
        ]
      }
      calendar_events: {
        Row: { id: string; org_id: string; user_id: string; title: string; description: string | null; start_at: string; end_at: string; all_day: boolean; color: string | null; experiment_id: string | null; protocol_id: string | null; location: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; org_id: string; user_id: string; title: string; description?: string | null; start_at: string; end_at: string; all_day?: boolean; color?: string | null; experiment_id?: string | null; protocol_id?: string | null; location?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; org_id?: string; user_id?: string; title?: string; description?: string | null; start_at?: string; end_at?: string; all_day?: boolean; color?: string | null; experiment_id?: string | null; protocol_id?: string | null; location?: string | null; created_at?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: 'calendar_events_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'calendar_events_experiment_id_fkey'; columns: ['experiment_id']; isOneToOne: false; referencedRelation: 'experiments'; referencedColumns: ['id'] },
          { foreignKeyName: 'calendar_events_protocol_id_fkey'; columns: ['protocol_id']; isOneToOne: false; referencedRelation: 'protocols'; referencedColumns: ['id'] }
        ]
      }
      planner_tasks: {
        Row: { id: string; user_id: string; name: string; description: string | null; priority: 'critical' | 'normal' | 'low'; placement: 'manual' | 'auto'; deadline: string | null; steps: Json; scheduled_start: string | null; color: string | null; conflict: boolean; conflict_reason: string | null; created_at: string }
        Insert: { id?: string; user_id: string; name: string; description?: string | null; priority?: 'critical' | 'normal' | 'low'; placement?: 'manual' | 'auto'; deadline?: string | null; steps?: Json; scheduled_start?: string | null; color?: string | null; conflict?: boolean; conflict_reason?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; name?: string; description?: string | null; priority?: 'critical' | 'normal' | 'low'; placement?: 'manual' | 'auto'; deadline?: string | null; steps?: Json; scheduled_start?: string | null; color?: string | null; conflict?: boolean; conflict_reason?: string | null; created_at?: string }
        Relationships: []
      }
      task_templates: {
        Row: { id: string; user_id: string; name: string; color: string | null; steps: Json; created_at: string }
        Insert: { id?: string; user_id: string; name: string; color?: string | null; steps?: Json; created_at?: string }
        Update: { id?: string; user_id?: string; name?: string; color?: string | null; steps?: Json; created_at?: string }
        Relationships: []
      }
      reports: {
        Row: { id: string; experiment_id: string; template_id: string | null; created_by: string; created_at: string }
        Insert: { id?: string; experiment_id: string; template_id?: string | null; created_by: string; created_at?: string }
        Update: { id?: string; experiment_id?: string; template_id?: string | null; created_by?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: 'reports_experiment_id_fkey'; columns: ['experiment_id']; isOneToOne: false; referencedRelation: 'experiments'; referencedColumns: ['id'] }
        ]
      }
      report_blocks: {
        Row: { id: string; report_id: string; template_block_id: string | null; type: 'heading' | 'text' | 'image_placeholder' | 'data_table'; order: number; content: string | null; storage_url: string | null; created_at: string }
        Insert: { id?: string; report_id: string; template_block_id?: string | null; type: 'heading' | 'text' | 'image_placeholder' | 'data_table'; order?: number; content?: string | null; storage_url?: string | null; created_at?: string }
        Update: { id?: string; report_id?: string; template_block_id?: string | null; type?: 'heading' | 'text' | 'image_placeholder' | 'data_table'; order?: number; content?: string | null; storage_url?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: 'report_blocks_report_id_fkey'; columns: ['report_id']; isOneToOne: false; referencedRelation: 'reports'; referencedColumns: ['id'] }
        ]
      }
      nb_protocols: {
        Row: { id: string; title: string; content: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; title: string; content?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; title?: string; content?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      nb_experiments: {
        Row: { id: string; protocol_id: string | null; notes_raw: string | null; notes_parsed: string | null; report_json: Json | null; status: string; created_at: string; updated_at: string }
        Insert: { id?: string; protocol_id?: string | null; notes_raw?: string | null; notes_parsed?: string | null; report_json?: Json | null; status?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; protocol_id?: string | null; notes_raw?: string | null; notes_parsed?: string | null; report_json?: Json | null; status?: string; created_at?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: 'nb_experiments_protocol_id_fkey'; columns: ['protocol_id']; isOneToOne: false; referencedRelation: 'nb_protocols'; referencedColumns: ['id'] }
        ]
      }
      nb_qr_sessions: {
        Row: { id: string; experiment_id: string | null; session_token: string; status: string; files_data: Json | null; created_at: string; updated_at: string }
        Insert: { id?: string; experiment_id?: string | null; session_token: string; status?: string; files_data?: Json | null; created_at?: string; updated_at?: string }
        Update: { id?: string; experiment_id?: string | null; session_token?: string; status?: string; files_data?: Json | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      nb_result_files: {
        Row: { id: string; experiment_id: string | null; file_name: string; file_type: string | null; file_size: number | null; file_data: string | null; description: string | null; protocol_step: string | null; tags: string[] | null; storage_url: string | null; uploaded_at: string }
        Insert: { id?: string; experiment_id?: string | null; file_name: string; file_type?: string | null; file_size?: number | null; file_data?: string | null; description?: string | null; protocol_step?: string | null; tags?: string[] | null; storage_url?: string | null; uploaded_at?: string }
        Update: { id?: string; experiment_id?: string | null; file_name?: string; file_type?: string | null; file_size?: number | null; file_data?: string | null; description?: string | null; protocol_step?: string | null; tags?: string[] | null; storage_url?: string | null; uploaded_at?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_org_id: { Args: Record<string, never>; Returns: string }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience row types
export type Organization = Database['public']['Tables']['organizations']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Sample = Database['public']['Tables']['samples']['Row']
export type Machine = Database['public']['Tables']['machines']['Row']
export type Reagent = Database['public']['Tables']['reagents']['Row']
export type Protocol = Database['public']['Tables']['protocols']['Row']
export type ReportTemplate = Database['public']['Tables']['report_templates']['Row']
export type TemplateBlock = Database['public']['Tables']['template_blocks']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type ExperimentSet = Database['public']['Tables']['experiment_sets']['Row']
export type Experiment = Database['public']['Tables']['experiments']['Row']
export type ExperimentFile = Database['public']['Tables']['experiment_files']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type ReportBlock = Database['public']['Tables']['report_blocks']['Row']
export type CalendarEventRow = Database['public']['Tables']['calendar_events']['Row']
export type PlannerTaskRow = Database['public']['Tables']['planner_tasks']['Row']
export type TaskTemplateRow = Database['public']['Tables']['task_templates']['Row']
