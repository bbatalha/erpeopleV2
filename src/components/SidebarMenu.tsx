import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Brain, LayoutDashboard, UserCircle, History, Settings, LogOut, Shield } from 'lucide-react'
import { Sidebar, SidebarBody, SidebarLink } from './ui/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function SidebarMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, user, isLoggingOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

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
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo open={open} />
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