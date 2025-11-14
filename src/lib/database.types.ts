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
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'team_lead' | 'employee'
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'admin' | 'team_lead' | 'employee'
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'team_lead' | 'employee'
          created_at?: string
          created_by?: string | null
        }
      }
      password_entries: {
        Row: {
          id: string
          website_name: string
          website_url: string
          username: string
          password: string
          notes: string
          otp_required: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          website_name: string
          website_url: string
          username: string
          password: string
          notes?: string
          otp_required?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          website_name?: string
          website_url?: string
          username?: string
          password?: string
          notes?: string
          otp_required?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      password_assignments: {
        Row: {
          id: string
          password_entry_id: string
          assigned_to: string
          assigned_by: string
          assigned_at: string
          notification_sent: boolean
        }
        Insert: {
          id?: string
          password_entry_id: string
          assigned_to: string
          assigned_by: string
          assigned_at?: string
          notification_sent?: boolean
        }
        Update: {
          id?: string
          password_entry_id?: string
          assigned_to?: string
          assigned_by?: string
          assigned_at?: string
          notification_sent?: boolean
        }
      }
      otp_requests: {
        Row: {
          id: string
          password_entry_id: string
          requested_by: string
          otp_code: string
          expires_at: string
          is_used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          password_entry_id: string
          requested_by: string
          otp_code: string
          expires_at: string
          is_used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          password_entry_id?: string
          requested_by?: string
          otp_code?: string
          expires_at?: string
          is_used?: boolean
          created_at?: string
        }
      }
    }
  }
}
