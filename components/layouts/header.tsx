/**
 * Header Component
 * Dashboard header with user menu and notifications
 */

'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Bell, LogOut, User, Menu } from 'lucide-react'
import { useUIStore } from '@/store'

export default function Header() {
  const { data: session } = useSession()
  const { toggleSidebar } = useUIStore()

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' })
  }

  return (
    <div className="flex items-center justify-between px-6 py-4">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition"
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
            <p className="text-sm font-medium text-slate-900">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-xs text-slate-600">
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
  )
}
