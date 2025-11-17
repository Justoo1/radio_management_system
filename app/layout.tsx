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
  title: 'Radio Management System - Multi-Tenant SaaS',
  description:
    'Complete platform for radio stations to manage clients, programs, SMS campaigns, and advertising',
  keywords: [
    'radio',
    'management',
    'sms',
    'advertising',
    'saas',
    'ghana',
    'broadcast',
  ],
  authors: [
    {
      name: 'Radio Management',
    },
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Radio Management System',
    description:
      'Complete platform for radio stations to manage clients, programs, SMS campaigns, and advertising',
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
