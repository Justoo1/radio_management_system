/**
 * Sidebar Component
 * Navigation sidebar for dashboard
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Radio,
  MessageSquare,
  Image,
  Megaphone,
  FileText,
  BarChart3,
  Users2,
  Settings,
  Receipt,
  Podcast,
  LucideIcon,
} from 'lucide-react'

interface MenuItem {
  href: string
  label: string
  icon: LucideIcon
  highlight?: boolean
}

const menuItems: MenuItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/on-air', label: 'Live On-Air', icon: Podcast, highlight: true },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/programs', label: 'Programs', icon: Radio },
  { href: '/teams', label: 'Teams', icon: Users2, highlight: true },
  { href: '/sms/campaigns', label: 'SMS Campaigns', icon: MessageSquare },
  { href: '/media', label: 'Media Library', icon: Image },
  { href: '/advertising', label: 'Advertising', icon: Megaphone },
  { href: '/contracts', label: 'Contracts', icon: FileText },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link href="/dashboard" className="px-6 py-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">RadioMgmt</h1>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? item.highlight
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-slate-800 text-white'
                  : item.highlight
                  ? 'bg-gradient-to-r from-purple-600/10 to-pink-600/10 text-purple-300 hover:from-purple-600/20 hover:to-pink-600/20 border border-purple-500/30'
                  : 'text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
              {item.highlight && !isActive && (
                <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  NEW
                </span>
              )}
              {item.highlight && isActive && (
                <span className="ml-auto">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 px-6 py-4">
        <Link href="/settings/profile" className="text-sm text-slate-400 hover:text-white transition">
          Settings
        </Link>
      </div>
    </div>
  )
}
