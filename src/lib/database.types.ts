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
      assessments: {
        Row: {
          id: string
          type: 'disc' | 'hexaco' | 'behavior'
          title: string
          description: string | null
          estimated_time_minutes: number
          question_count: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'disc' | 'hexaco' | 'behavior'
          title: string
          description?: string | null
          estimated_time_minutes: number
          question_count: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'disc' | 'hexaco' | 'behavior'
          title?: string
          description?: string | null
          estimated_time_minutes?: number
          question_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      assessment_responses: {
        Row: {
          id: string
          user_id: string
          assessment_id: string
          status: 'in_progress' | 'completed'
          started_at: string
          completed_at: string | null
          responses: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          assessment_id: string
          status?: 'in_progress' | 'completed'
          started_at?: string
          completed_at?: string | null
          responses?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          assessment_id?: string
          status?: 'in_progress' | 'completed'
          started_at?: string
          completed_at?: string | null
          responses?: Json
          created_at?: string
          updated_at?: string
        }
      }
      assessment_results: {
        Row: {
          id: string
          response_id: string
          user_id: string
          assessment_id: string
          results: Json
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          response_id: string
          user_id: string
          assessment_id: string
          results: Json
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          response_id?: string
          user_id?: string
          assessment_id?: string
          results?: Json
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          role: 'user' | 'admin'
          full_name: string | null
          company: string | null
          position: string | null
          linkedin_url: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'user' | 'admin'
          full_name?: string | null
          company?: string | null
          position?: string | null
          linkedin_url: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'user' | 'admin'
          full_name?: string | null
          company?: string | null
          position?: string | null
          linkedin_url?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}