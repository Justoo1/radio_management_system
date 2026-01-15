/**
 * Navigation Configuration
 * Defines navigation structure and menu items
 */

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
  LucideIcon,
  Activity,
  Wifi,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon?: LucideIcon
  badge?: string
  children?: NavItem[]
}

// Dashboard Navigation
export const dashboardNav: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/clients',
    label: 'Clients',
    icon: Users,
    children: [
      {
        href: '/clients',
        label: 'All Clients',
      },
      {
        href: '/clients/new',
        label: 'Add Client',
      },
    ],
  },
  {
    href: '/programs',
    label: 'Programs',
    icon: Radio,
    children: [
      {
        href: '/programs',
        label: 'All Programs',
      },
      {
        href: '/programs/new',
        label: 'Create Program',
      },
      {
        href: '/programs/calendar',
        label: 'Schedule',
      },
    ],
  },
  {
    href: '/sms',
    label: 'SMS Campaigns',
    icon: MessageSquare,
    children: [
      {
        href: '/sms/campaigns',
        label: 'Campaigns',
      },
      {
        href: '/sms/templates',
        label: 'Templates',
      },
      {
        href: '/sms/credits',
        label: 'Credits',
      },
    ],
  },
  {
    href: '/media',
    label: 'Media Library',
    icon: Image,
    children: [
      {
        href: '/media',
        label: 'Library',
      },
      {
        href: '/media/upload',
        label: 'Upload',
      },
    ],
  },
  {
    href: '/streaming',
    label: 'Streaming',
    icon: Wifi,
    children: [
      {
        href: '/streaming',
        label: 'Dashboard',
      },
      {
        href: '/streaming/airtime',
        label: 'Airtime Bookings',
      },
      {
        href: '/streaming/airtime/packages',
        label: 'Airtime Packages',
      },
      {
        href: '/streaming/playlists',
        label: 'Playlists',
      },
      {
        href: '/streaming/media',
        label: 'Media Library',
      },
      {
        href: '/streaming/mount-points',
        label: 'Mount Points',
      },
      {
        href: '/streaming/dj-accounts',
        label: 'DJ Accounts',
      },
      {
        href: '/streaming/settings',
        label: 'Settings',
      },
    ],
  },
  {
    href: '/advertising',
    label: 'Advertising',
    icon: Megaphone,
    children: [
      {
        href: '/advertising/campaigns',
        label: 'Campaigns',
      },
      {
        href: '/advertising/schedule',
        label: 'Schedule',
      },
    ],
  },
  {
    href: '/contracts',
    label: 'Contracts',
    icon: FileText,
  },
  {
    href: '/invoices',
    label: 'Invoices',
    icon: FileText,
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: BarChart3,
    children: [
      {
        href: '/reports',
        label: 'Overview',
      },
      {
        href: '/reports/revenue',
        label: 'Revenue',
      },
      {
        href: '/reports/sms',
        label: 'SMS Usage',
      },
      {
        href: '/reports/programs',
        label: 'Programs',
      },
    ],
  },
  {
    href: '/listeners',
    label: 'Listeners',
    icon: Activity,
    children: [
      {
        href: '/listeners',
        label: 'Overview',
      },
      {
        href: '/listeners/sessions',
        label: 'Sessions',
      },
      {
        href: '/listeners/metrics',
        label: 'Metrics',
      },
    ],
  },
  {
    href: '/team',
    label: 'Team',
    icon: Users2,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    children: [
      {
        href: '/settings',
        label: 'General',
      },
      {
        href: '/settings/organization',
        label: 'Organization',
      },
      {
        href: '/settings/billing',
        label: 'Billing',
      },
      {
        href: '/settings/profile',
        label: 'Profile',
      },
    ],
  },
]

// Marketing Navigation
export const marketingNav: NavItem[] = [
  {
    href: '/',
    label: 'Home',
  },
  {
    href: '/stations',
    label: 'Radio Stations',
  },
  {
    href: '/pricing',
    label: 'Pricing',
  },
  {
    href: '/features',
    label: 'Features',
  },
  {
    href: '/about',
    label: 'About',
  },
]

// Footer Navigation
export const footerNav = {
  product: [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' },
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: '#blog', label: 'Blog' },
    { href: '#contact', label: 'Contact' },
  ],
  legal: [
    { href: '#privacy', label: 'Privacy Policy' },
    { href: '#terms', label: 'Terms of Service' },
  ],
}
