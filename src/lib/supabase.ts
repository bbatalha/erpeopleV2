import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  // Provide fallback values for development
  supabaseUrl = 'https://your-project.supabase.co'
  supabaseAnonKey = 'your-anon-key'
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})