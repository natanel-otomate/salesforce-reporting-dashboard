export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly'

export type ScheduleDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type ReportStatus = 'active' | 'paused' | 'draft' | 'archived'

export type SendStatus = 'pending' | 'sent' | 'failed' | 'cancelled'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  monday_api_key: string | null
  monday_account_id: string | null
  timezone: string
  created_at: string
  updated_at: string
}

export interface BoardConfig {
  board_id: string
  board_name: string
  workspace_id: string
  workspace_name: string
  selected_columns: string[]
  filters: BoardFilter[]
  group_ids: string[]
  include_subitems: boolean
}

export interface BoardFilter {
  column_id: string
  column_name: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
  value: string
}

export interface ScheduleConfig {
  frequency: ScheduleFrequency
  day_of_week: ScheduleDay | null
  day_of_month: number | null
  hour: number
  minute: number
  timezone: string
}

export interface Report {
  id: string
  user_id: string
  name: string
  description: string | null
  boards: BoardConfig[]
  schedule: ScheduleConfig
  recipients: string[]
  status: ReportStatus
  last_sent_at: string | null
  next_send_at: string | null
  created_at: string
  updated_at: string
}

export interface ReportSend {
  id: string
  report_id: string
  user_id: string
  status: SendStatus
  recipient_count: number
  recipients: string[]
  snapshot_id: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
}

export interface ReportSnapshot {
  id: string
  report_id: string
  user_id: string
  boards_data: BoardSnapshotData[]
  generated_at: string
  row_count: number
  metadata: SnapshotMetadata
  created_at: string
}

export interface BoardSnapshotData {
  board_id: string
  board_name: string
  workspace_id: string
  workspace_name: string
  items: BoardItem[]
  groups: BoardGroup[]
  columns: BoardColumn[]
  fetched_at: string
}

export interface BoardItem {
  id: string
  name: string
  group_id: string
  group_title: string
  state: string
  created_at: string
  updated_at: string
  column_values: Record<string, BoardItemColumnValue>
  subitems?: BoardItem[]
}

export interface BoardItemColumnValue {
  id: string
  title: string
  text: string
  value: Json
  type: string
}

export interface BoardGroup {
  id: string
  title: string
  color: string
  position: string
}

export interface BoardColumn {
  id: string
  title: string
  type: string
  settings_str: string | null
}

export interface SnapshotMetadata {
  board_count: number
  total_items: number
  total_groups: number
  duration_ms: number
  monday_api_calls: number
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      reports: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          boards: Json
          schedule: Json
          recipients: string[]
          status: ReportStatus
          last_sent_at: string | null
          next_send_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at' | 'updated_at'>>
      }
      report_sends: {
        Row: {
          id: string
          report_id: string
          user_id: string
          status: SendStatus
          recipient_count: number
          recipients: string[]
          snapshot_id: string | null
          error_message: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['report_sends']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['report_sends']['Row'], 'id' | 'created_at'>>
      }
      report_snapshots: {
        Row: {
          id: string
          report_id: string
          user_id: string
          boards_data: Json
          generated_at: string
          row_count: number
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['report_snapshots']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['report_snapshots']['Row'], 'id' | 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      report_status: ReportStatus
      send_status: SendStatus
      schedule_frequency: ScheduleFrequency
    }
  }
}