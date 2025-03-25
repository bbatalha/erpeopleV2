import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Brain, LayoutDashboard, UserCircle, History, Settings, LogOut, Shield, X } from 'lucide-react'
import { Sidebar, SidebarBody, SidebarLink } from './ui/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface SidebarMenuProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function SidebarMenu({ open, setOpen }: SidebarMenuProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, user, isLoggingOut } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const checkAdminStatus = async () => {
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
      }
    }

    checkAdminStatus()
  }, [user])

  const handleSignOut = async () => {
    try {
      // Save last location before logout (excluding auth pages)
      if (!['/login', '/register', '/forgot-password'].includes(location.pathname)) {
        localStorage.setItem('lastRoute', location.pathname)
      }
      
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const links = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: <UserCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: 'History',
      href: '/history',
      icon: <History className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    // Admin link - only shown to admin users
    ...(isAdmin ? [{
      label: 'Admin',
      href: '/admin',
      icon: <Shield className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    }] : []),
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: isLoggingOut ? 'Saindo...' : 'Logout',
      href: '#',
      icon: <LogOut className={`text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0 ${isLoggingOut ? 'animate-pulse' : ''}`} />
    }
  ]

  return (
    <div 
      id="sidebar-menu"
      className={`fixed inset-y-0 left-0 z-40 ${open ? 'translate-x-0' : '-translate-x-full'} 
        transition-transform duration-300 ease-in-out md:translate-x-0`}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex items-center justify-between pt-4 px-4">
              <Logo open={open} />
              
              {/* Close button (mobile only) */}
              {isMobile && (
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={{
                    ...link,
                    onClick: link.label.includes('Logout') ? handleSignOut : undefined,
                    disabled: isLoggingOut && link.label.includes('Logout')
                  }}
                />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  )
}

const Logo = ({ open }: { open: boolean }) => {
  return (
    <div className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20">
      <Brain className="h-6 w-6 text-indigo-600" />
      {open && (
        <span className="font-medium text-black dark:text-white whitespace-pre">
          ERPeople
        </span>
      )}
    </div>
  )
}