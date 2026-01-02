/**
 * Sidebar Component
 * Navigation sidebar for dashboard
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  Radio,
  MessageSquare,
  Megaphone,
  FileText,
  BarChart3,
  Users2,
  Settings,
  Receipt,
  Podcast,
  LucideIcon,
  Lock,
  ImageIcon,
} from 'lucide-react'
import { getEnabledFeatures, getOrganizationName } from '@/app/actions/features'
import { Feature, isFeatureEnabled } from '@/lib/features'

interface MenuItem {
  href: string
  label: string
  icon: LucideIcon
  highlight?: boolean
  feature?: Feature // Optional feature flag
}

const menuItems: MenuItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/on-air', label: 'Live On-Air', icon: Podcast, highlight: true, feature: Feature.ON_AIR },
  { href: '/clients', label: 'Clients', icon: Users, feature: Feature.CLIENTS },
  { href: '/programs', label: 'Programs', icon: Radio, feature: Feature.PROGRAMS },
  { href: '/teams', label: 'Teams', icon: Users2, highlight: true, feature: Feature.TEAMS },
  { href: '/sms/campaigns', label: 'SMS Campaigns', icon: MessageSquare, feature: Feature.SMS_CAMPAIGNS },
  { href: '/media', label: 'Media Library', icon: ImageIcon, feature: Feature.MEDIA_LIBRARY },
  { href: '/advertising', label: 'Advertising', icon: Megaphone, feature: Feature.ADVERTISEMENTS },
  { href: '/contracts', label: 'Contracts', icon: FileText, feature: Feature.CONTRACTS },
  { href: '/invoices', label: 'Invoices', icon: FileText, feature: Feature.INVOICES },
  { href: '/expenses', label: 'Expenses', icon: Receipt, feature: Feature.EXPENSES },
  { href: '/reports', label: 'Reports', icon: BarChart3, feature: Feature.REPORTS },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  hideLogoOnMobile?: boolean
}

export default function Sidebar({ hideLogoOnMobile = false }: SidebarProps) {
  const pathname = usePathname()
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [orgName, setOrgName] = useState('Radio Management')

  useEffect(() => {
    async function loadData() {
      try {
        const [features, organizationName] = await Promise.all([
          getEnabledFeatures(),
          getOrganizationName(),
        ])
        setEnabledFeatures(features)
        setOrgName(organizationName)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Logo - hidden on mobile sidebar since overlay has it */}
      {!hideLogoOnMobile && (
        <Link href="/dashboard" className="px-6 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-white.svg"
              alt="RMS Logo"
              width={40}
              height={40}
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-white truncate">
                {orgName}
              </h1>
              <p className="text-xs text-slate-400">RMS</p>
            </div>
          </div>
        </Link>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          // Check if feature is locked
          const isLocked = item.feature && !loading && !isFeatureEnabled(enabledFeatures, item.feature)

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
                  : isLocked
                  ? 'text-slate-500 hover:bg-slate-800/30'
                  : 'text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>

              {/* Lock Icon for locked features */}
              {isLocked && (
                <span className="ml-auto">
                  <Lock size={16} className="text-slate-500" />
                </span>
              )}

              {/* Highlight badge */}
              {item.highlight && !isActive && !isLocked && (
                <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  NEW
                </span>
              )}

              {/* Active pulse */}
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
