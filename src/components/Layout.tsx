import React from 'react'
import { useLocation } from 'react-router-dom'
import { SidebarMenu } from './SidebarMenu'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {!isPublicPage && <SidebarMenu />}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 container mx-auto px-4 py-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}