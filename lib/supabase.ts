import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          monday_token: string | null;
          sync_interval_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          monday_token?: string | null;
          sync_interval_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          monday_token?: string | null;
          sync_interval_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          monday_workspace_id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          monday_workspace_id: string;
          user_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          monday_workspace_id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      boards: {
        Row: {
          id: string;
          monday_board_id: string;
          workspace_id: string;
          user_id: string;
          name: string;
          total_items: number;
          completed_items: number;
          overdue_items: number;
          last_synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          monday_board_id: string;
          workspace_id: string;
          user_id: string;
          name: string;
          total_items?: number;
          completed_items?: number;
          overdue_items?: number;
          last_synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          monday_board_id?: string;
          workspace_id?: string;
          user_id?: string;
          name?: string;
          total_items?: number;
          completed_items?: number;
          overdue_items?: number;
          last_synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          monday_item_id: string;
          board_id: string;
          user_id: string;
          name: string;
          status: string | null;
          due_date: string | null;
          is_completed: boolean;
          is_overdue: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          monday_item_id: string;
          board_id: string;
          user_id: string;
          name: string;
          status?: string | null;
          due_date?: string | null;
          is_completed?: boolean;
          is_overdue?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          monday_item_id?: string;
          board_id?: string;
          user_id?: string;
          name?: string;
          status?: string | null;
          due_date?: string | null;
          is_completed?: boolean;
          is_overdue?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sync_logs: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          boards_synced: number;
          items_synced: number;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          status: string;
          boards_synced?: number;
          items_synced?: number;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: string;
          boards_synced?: number;
          items_synced?: number;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
      };
      digest_logs: {
        Row: {
          id: string;
          user_id: string;
          sent_at: string;
          status: string;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          sent_at?: string;
          status: string;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          sent_at?: string;
          status?: string;
          error_message?: string | null;
        };
      };
      digest_settings: {
        Row: {
          id: string;
          user_id: string;
          enabled: boolean;
          frequency: string;
          day_of_week: number | null;
          time_of_day: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          enabled?: boolean;
          frequency: string;
          day_of_week?: number | null;
          time_of_day: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          enabled?: boolean;
          frequency?: string;
          day_of_week?: number | null;
          time_of_day?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export function createBrowserClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export function createServerClient() {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}