/**
 * Root Layout
 * Global layout for all pages with providers and configuration
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/session-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Radio Management System - Multi-Tenant SaaS Platform',
    template: '%s | Radio Management System',
  },
  description:
    'Complete platform for radio stations in Ghana to manage clients, programs, SMS campaigns, advertising, and on-air broadcasting',
  keywords: [
    'radio',
    'management',
    'sms',
    'advertising',
    'saas',
    'ghana',
    'broadcast',
    'on-air',
    'radio station',
    'broadcasting',
  ],
  authors: [
    {
      name: 'Radio Management System',
    },
  ],
  creator: 'Radio Management System',
  publisher: 'Radio Management System',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RMS',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://radio.edtmsys.com',
    title: 'Radio Management System',
    description:
      'Complete platform for radio stations in Ghana to manage clients, programs, SMS campaigns, advertising, and on-air broadcasting',
    siteName: 'Radio Management System',
    images: [
      {
        url: '/logo.svg',
        width: 200,
        height: 200,
        alt: 'Radio Management System Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Radio Management System',
    description:
      'Complete platform for radio stations to manage all operations',
    images: ['/logo.svg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900')}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ToastProvider />
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
