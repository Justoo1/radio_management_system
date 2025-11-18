/**
 * Admin Route Group Layout
 * Provides shared layout for all admin pages
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Manage organizations, subscriptions, and payments',
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Admin header/navigation could go here if needed */}
        <main className="min-h-screen">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
            <p>© 2024 Radio Management System - Admin Dashboard. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
