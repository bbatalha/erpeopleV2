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
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  isLoggingOut: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // Handle refresh token error
      if (error && error.message.includes('Refresh Token Not Found')) {
        console.warn('Invalid refresh token detected, clearing session data');
        // Clear local storage to remove invalid tokens
        localStorage.removeItem('supabase.auth.token');
        // Additional cleanup for any auth-related items
        localStorage.removeItem('supabase.auth.expires_at');
        localStorage.removeItem('supabase.auth.refresh_token');
        setUser(null);
        setLoading(false);
        return;
      }
      
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
    try {
      // Validate inputs before sending to Supabase
      if (!email || !password || !fullName || !linkedinUrl) {
        throw new Error('Todos os campos são obrigatórios')
      }

      // Make sure LinkedIn URL is properly formatted
      if (!linkedinUrl.match(/^https:\/\/(www\.)?linkedin\.com\//)) {
        throw new Error('URL do LinkedIn inválida')
      }

      // Clean up URL - remove trailing slashes
      const cleanLinkedinUrl = linkedinUrl.trim().replace(/\/+$/, '')

      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            linkedin_url: cleanLinkedinUrl
          }
        }
      })

      if (error) throw error
      
      if (!authData.user) {
        throw new Error('Falha na criação do usuário')
      }
      
      // Start LinkedIn profile fetch in background
      if (authData.user) {
        try {
          const profile = await fetchLinkedInProfile(cleanLinkedinUrl)
          if (profile) {
            await updateUserProfile(authData.user.id, profile)
          } else {
            console.warn('Não foi possível buscar o perfil do LinkedIn:', cleanLinkedinUrl)
          }
        } catch (profileError) {
          console.error('Erro ao buscar perfil do LinkedIn:', profileError)
          // Continue anyway, as this is a background enhancement
          toast.error('Não foi possível recuperar dados do LinkedIn. Você pode atualizar seu perfil mais tarde.')
        }
      }

      return authData
    } catch (err) {
      console.error('Signup error:', err)
      throw err
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

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
    } catch (err) {
      console.error('Error resetting password:', err)
      throw err
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      })

      if (error) throw error
    } catch (err) {
      console.error('Error updating password:', err)
      throw err
    }
  }

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
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