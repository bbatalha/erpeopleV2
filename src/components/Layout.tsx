import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SidebarMenu } from './SidebarMenu'
import { Menu } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive sidebar based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    // Initial check
    checkScreenSize()
    
    // Add event listener
    window.addEventListener('resize', checkScreenSize)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && sidebarOpen) {
        const sidebar = document.getElementById('sidebar-menu')
        const toggleButton = document.getElementById('sidebar-toggle')
        
        if (sidebar && 
            !sidebar.contains(event.target as Node) && 
            toggleButton && 
            !toggleButton.contains(event.target as Node)) {
          setSidebarOpen(false)
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, sidebarOpen])

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {!isPublicPage && (
        <>
          <SidebarMenu open={sidebarOpen} setOpen={setSidebarOpen} />
          
          {/* Mobile menu toggle button */}
          {isMobile && !sidebarOpen && (
            <button 
              id="sidebar-toggle"
              className="fixed top-4 left-4 z-20 p-2 rounded-md bg-white shadow-md text-gray-700"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </>
      )}
      
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
        !isPublicPage && !isMobile && sidebarOpen ? 'md:ml-[300px]' : ''
      }`}>
        <main className="flex-1 container mx-auto px-4 py-4 sm:py-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}