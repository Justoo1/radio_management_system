/**
 * Dashboard Layout
 * Layout for protected dashboard pages
 * Includes sidebar, header, and main content area
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Sidebar from '@/components/layouts/sidebar'
import Header from '@/components/layouts/header'
import MobileSidebarOverlay from '@/components/layouts/mobile-sidebar-overlay'
import { BillingBanner } from '@/components/billing-banner'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <MobileSidebarOverlay />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="border-b bg-white">
          <Header />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {/* Billing Banner */}
            <BillingBanner />

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
