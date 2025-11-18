/**
 * Settings Layout
 * Wraps all settings pages with header and navigation
 */

'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Building2, User, CreditCard, Bell } from 'lucide-react'

const tabs = [
  { path: '/settings', label: 'Organization', icon: Building2 },
  { path: '/settings/account', label: 'Account', icon: User },
  { path: '/settings/billing', label: 'Billing', icon: CreditCard },
  { path: '/settings/notifications', label: 'Notifications', icon: Bell },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-slate-400 text-lg">Manage your organization and account settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path
            const Icon = tab.icon
            return (
              <button
                key={tab.path}
                onClick={() => router.push(tab.path)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 font-medium'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}
