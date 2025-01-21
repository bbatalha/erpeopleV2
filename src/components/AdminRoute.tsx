import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Brain } from 'lucide-react'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        // Fetch the user's profile with role
        const { data, error } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error checking admin status:', error)
          throw error
        }
        
        // Verify admin status
        const isUserAdmin = data?.role === 'admin'
        setIsAdmin(isUserAdmin)

        // Log access attempt for security
        console.info(`Admin access attempt by ${data?.email}: ${isUserAdmin ? 'granted' : 'denied'}`)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}