/**
 * Header Component
 * Dashboard header with user menu and notifications
 */

'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { Bell, LogOut, User, Menu, Shield } from 'lucide-react'
import { useUIStore } from '@/store'

export default function Header() {
  const { data: session } = useSession()
  const { toggleSidebar } = useUIStore()
  const [showAdminAccess, setShowAdminAccess] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' })
  }

  // Long press on logo to reveal admin access (3 seconds)
  const handleLogoPress = () => {
    longPressTimer.current = setTimeout(() => {
      setShowAdminAccess(true)
      // Auto-hide after 10 minutes
      setTimeout(() => setShowAdminAccess(false), 10 * 60 * 1000)
    }, 3000)
  }

  const handleLogoRelease = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 text-gray-50 ">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            id="menu-button"
            onClick={toggleSidebar}
            onTouchStart={handleLogoPress}
            onTouchEnd={handleLogoRelease}
            onMouseDown={handleLogoPress}
            onMouseUp={handleLogoRelease}
            onMouseLeave={handleLogoRelease}
            className="lg:hidden p-2 hover:bg-slate-700 text-gray-50 rounded-lg transition"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="p-2 hover:bg-slate-100 rounded-lg transition relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium text-gray-50">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-50">
                {session?.user?.email || 'user@example.com'}
              </p>
            </div>

            {/* Dropdown Menu */}
            <div className="relative group">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition">
                <User size={20} />
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 w-48 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-50">
                <Link
                  href="/settings/profile"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Settings
                </Link>

                {/* Hidden Admin Access - revealed after long press */}
                {showAdminAccess && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 border-t border-slate-200"
                  >
                    <Shield size={16} />
                    Admin Access
                  </Link>
                )}

                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Access Toast - shown briefly after activation */}
      {showAdminAccess && (
        <div className="fixed top-20 right-6 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          <p className="text-sm font-medium flex items-center gap-2">
            <Shield size={16} />
            Developer access enabled
          </p>
        </div>
      )}
    </>
  )
}
