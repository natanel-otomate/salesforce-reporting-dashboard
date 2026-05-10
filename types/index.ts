export interface User {
  id: string;
  email: string;
  monday_token: string | null;
  sync_interval_minutes: number;
  digest_enabled: boolean;
  digest_day: string | null;
  digest_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  monday_workspace_id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  monday_board_id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  total_items: number;
  completed_items: number;
  overdue_items: number;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Item {
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
}

export interface SyncLog {
  id: string;
  user_id: string;
  status: 'success' | 'failure' | 'in_progress';
  boards_synced: number;
  items_synced: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface DigestLog {
  id: string;
  user_id: string;
  status: 'sent' | 'failed' | 'pending';
  recipient_email: string;
  boards_included: number;
  error_message: string | null;
  scheduled_for: string;
  sent_at: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User> & { id: string; email: string };
        Update: Partial<User>;
      };
      workspaces: {
        Row: Workspace;
        Insert: Partial<Workspace> & { monday_workspace_id: string; user_id: string; name: string };
        Update: Partial<Workspace>;
      };
      boards: {
        Row: Board;
        Insert: Partial<Board> & { monday_board_id: string; workspace_id: string; user_id: string; name: string };
        Update: Partial<Board>;
      };
      items: {
        Row: Item;
        Insert: Partial<Item> & { monday_item_id: string; board_id: string; user_id: string; name: string };
        Update: Partial<Item>;
      };
      sync_logs: {
        Row: SyncLog;
        Insert: Partial<SyncLog> & { user_id: string };
        Update: Partial<SyncLog>;
      };
      digest_logs: {
        Row: DigestLog;
        Insert: Partial<DigestLog> & { user_id: string; recipient_email: string };
        Update: Partial<DigestLog>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}