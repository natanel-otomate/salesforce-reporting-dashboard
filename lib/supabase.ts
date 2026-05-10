import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      reports: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          workspace_ids: string[]
          board_ids: string[]
          schedule_cron: string | null
          schedule_enabled: boolean
          recipients: string[]
          last_run_at: string | null
          next_run_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          workspace_ids?: string[]
          board_ids?: string[]
          schedule_cron?: string | null
          schedule_enabled?: boolean
          recipients?: string[]
          last_run_at?: string | null
          next_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          workspace_ids?: string[]
          board_ids?: string[]
          schedule_cron?: string | null
          schedule_enabled?: boolean
          recipients?: string[]
          last_run_at?: string | null
          next_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      snapshots: {
        Row: {
          id: string
          report_id: string
          data: Json
          generated_at: string
          sent_at: string | null
          recipient_count: number
          status: 'pending' | 'sent' | 'failed'
          error_message: string | null
        }
        Insert: {
          id?: string
          report_id: string
          data: Json
          generated_at?: string
          sent_at?: string | null
          recipient_count?: number
          status?: 'pending' | 'sent' | 'failed'
          error_message?: string | null
        }
        Update: {
          id?: string
          report_id?: string
          data?: Json
          generated_at?: string
          sent_at?: string | null
          recipient_count?: number
          status?: 'pending' | 'sent' | 'failed'
          error_message?: string | null
        }
      }
      workspaces: {
        Row: {
          id: string
          user_id: string
          monday_workspace_id: string
          name: string
          api_token_encrypted: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          monday_workspace_id: string
          name: string
          api_token_encrypted: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          monday_workspace_id?: string
          name?: string
          api_token_encrypted?: string
          created_at?: string
          updated_at?: string
        }
      }
      monday_tokens: {
        Row: {
          id: string
          user_id: string
          token_encrypted: string
          workspace_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token_encrypted: string
          workspace_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token_encrypted?: string
          workspace_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  )
}

/**
 * Singleton browser client — safe to call multiple times.
 * Use this in Client Components.
 */
let browserClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createBrowserClient(): ReturnType<typeof createSupabaseClient<Database>> {
  if (browserClient) return browserClient
  browserClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return browserClient
}

/**
 * Server client — creates a new instance per request using the cookies store.
 * Use this in Server Components and Route Handlers.
 */
export function createServerClient(): ReturnType<typeof createSupabaseClient<Database>> {
  const cookieStore = cookies()

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        cookie: cookieStore.toString(),
      },
    },
  })
}

/**
 * Default export: a typed Supabase client factory.
 * Alias for createBrowserClient for backwards compatibility and
 * to satisfy any import that calls createClient() from this module.
 */
export function createClient(): ReturnType<typeof createSupabaseClient<Database>> {
  return createBrowserClient()
}

export default createBrowserClient