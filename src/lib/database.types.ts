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
  Tables: {
    companies: {
      Row: {
        id: string
        name: string
        domain: string
        industry: string
        employee_range: string
        linkedin_url: string
        logo_url: string
        website: string
        year_founded: number
        description: string
        hq_city: string
        hq_country: string
        hq_region: string
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        name: string
        domain: string
        industry?: string
        employee_range?: string
        linkedin_url?: string
        logo_url?: string
        website?: string
        year_founded?: number
        description?: string
        hq_city?: string
        hq_country?: string
        hq_region?: string
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        name?: string
        domain?: string
        industry?: string
        employee_range?: string
        linkedin_url?: string
        logo_url?: string
        website?: string
        year_founded?: number
        description?: string
        hq_city?: string
        hq_country?: string
        hq_region?: string
        created_at?: string
        updated_at?: string
      }
    }
    education: {
      Row: {
        id: string
        user_id: string
        degree: string
        field_of_study: string
        school: string
        school_linkedin_url: string
        school_logo_url: string
        date_range: string
        start_month: string
        start_year: number
        end_month: string
        end_year: number
        activities: string
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        user_id: string
        degree: string
        field_of_study: string
        school: string
        school_linkedin_url?: string
        school_logo_url?: string
        date_range?: string
        start_month?: string
        start_year?: number
        end_month?: string
        end_year?: number
        activities?: string
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        user_id?: string
        degree?: string
        field_of_study?: string
        school?: string
        school_linkedin_url?: string
        school_logo_url?: string
        date_range?: string
        start_month?: string
        start_year?: number
        end_month?: string
        end_year?: number
        activities?: string
        created_at?: string
        updated_at?: string
      }
    }
    experience: {
      Row: {
        id: string
        user_id: string
        company_name: string
        company_logo_url: string
        job_title: string
        start_month: number
        start_year: number
        end_month: string
        end_year: string
        is_current: boolean
        description: string
        location: string
        skills: string
        job_type: string
        duration: string
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        user_id: string
        company_name: string
        company_logo_url?: string
        job_title: string
        start_month: number
        start_year: number
        end_month?: string
        end_year?: string
        is_current?: boolean
        description?: string
        location?: string
        skills?: string
        job_type?: string
        duration?: string
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        user_id?: string
        company_name?: string
        company_logo_url?: string
        job_title?: string
        start_month?: number
        start_year?: number
        end_month?: string
        end_year?: string
        is_current?: boolean
        description?: string
        location?: string
        skills?: string
        job_type?: string
        duration?: string
        created_at?: string
        updated_at?: string
      }
    }
    webhook_logs: {
      Row: {
        id: string
        webhook_type: string
        user_id: string
        request_data: Json
        status: string
        error_message: string
        created_at: string
      }
      Insert: {
        id?: string
        webhook_type: string
        user_id?: string
        request_data: Json
        status: string
        error_message?: string
        created_at?: string
      }
      Update: {
        id?: string
        webhook_type?: string
        user_id?: string
        request_data?: Json
        status?: string
        error_message?: string
        created_at?: string
      }
    }
  }
}