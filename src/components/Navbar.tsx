import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Brain, LogOut, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setIsAdmin(data?.role === 'admin')
      } catch (err) {
        console.error('Error checking admin status:', err)
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <Brain className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ERPeople</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center text-gray-500 hover:text-gray-700"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Admin
                  </Link>
                )}
                <Link
                  to="/history"
                  className="text-gray-500 hover:text-gray-700"
                >
                  History
                </Link>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}