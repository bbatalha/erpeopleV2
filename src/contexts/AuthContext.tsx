import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import { fetchLinkedInProfile, updateUserProfile } from '../lib/linkedinProfileFetcher'
import { toast } from 'react-hot-toast'

interface AuthError {
  message: string
  __isAuthError?: boolean
}

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, linkedinUrl: string) => Promise<void>
  signOut: () => Promise<void>
  isLoggingOut: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
      setIsLoggingOut(true)

      // Clear any application-specific cache or data
      localStorage.removeItem('lastRoute')
      localStorage.removeItem('userPreferences')
      sessionStorage.clear()
      
      // Remove any custom cookies related to auth
      document.cookie.split(";").forEach(cookie => {
        const [name] = cookie.trim().split("=")
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })
      
      // Call Supabase signOut to invalidate the session on the server
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Show success toast notification
      toast.success('Você saiu com sucesso', { 
        duration: 3000,
        position: 'top-center',
        icon: '👋'
      })
      
      // Clear user state
      setUser(null)
    } catch (err) {
      console.error('Error signing out:', err)
      toast.error('Erro ao desconectar. Tente novamente.')
      throw err
    } finally {
      setIsLoggingOut(false)
    }
  }

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    isLoggingOut
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