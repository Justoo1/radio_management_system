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
} from 'lucide-react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/programs', label: 'Programs', icon: Radio },
  { href: '/sms', label: 'SMS Campaigns', icon: MessageSquare },
  { href: '/media', label: 'Media Library', icon: Image },
  { href: '/advertising', label: 'Advertising', icon: Megaphone },
  { href: '/contracts', label: 'Contracts', icon: FileText },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/team', label: 'Team', icon: Users2 },
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
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
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
