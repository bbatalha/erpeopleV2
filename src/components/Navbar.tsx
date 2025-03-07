import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Brain, LogOut, Shield, User, History, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setIsAdmin(data?.role === 'admin')
        setUserName(data?.full_name || '')
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

  const closeProfileMenu = () => {
    setShowProfileMenu(false)
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
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="hidden sm:inline-block font-medium">
                      {userName || 'Profile'}
                    </span>
                  </button>

                  {showProfileMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={closeProfileMenu}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                        <Link
                          to="/profile"
                          onClick={closeProfileMenu}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <User className="w-4 h-4 mr-3" />
                          View Profile
                        </Link>
                        <Link
                          to="/history"
                          onClick={closeProfileMenu}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <History className="w-4 h-4 mr-3" />
                          Assessment History
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={closeProfileMenu}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Shield className="w-4 h-4 mr-3" />
                            Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            closeProfileMenu()
                            handleSignOut()
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}