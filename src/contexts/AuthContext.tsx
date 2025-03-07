import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import { fetchLinkedInProfile, updateUserProfile } from '../lib/linkedinProfileFetcher'

interface AuthError {
  message: string
  __isAuthError?: boolean
}

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, linkedinUrl: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string, linkedinUrl: string) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          linkedin_url: linkedinUrl
        }
      }
    })

    if (error) throw error
    
    // Start LinkedIn profile fetch in background
    if (authData.user) {
      fetchLinkedInProfile(linkedinUrl).then(profile => {
        if (profile) {
          updateUserProfile(authData.user.id, profile)
        }
      })
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Login error:', error)
        throw error
      }

      // Verify session was created
      if (!data.session) {
        throw new Error('No session created')
      }
    } catch (err) {
      const authError = err as AuthError
      if (authError.__isAuthError) {
        throw new Error('Invalid login credentials')
      }
      throw err
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err) {
      console.error('Error signing out:', err)
      throw err
    }
  }

  const value = {
    user,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}