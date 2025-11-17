/**
 * Marketing Layout
 * Layout for public marketing pages
 * Includes header with navigation and footer
 */

import Header from '@/components/layouts/header-marketing'
import Footer from '@/components/layouts/footer'

export const dynamic = 'force-dynamic'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-40">
        <Header />
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-900 text-white mt-12">
        <Footer />
      </footer>
    </div>
  )
}
