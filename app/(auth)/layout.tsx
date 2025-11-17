/**
 * Auth Layout
 * Layout for authentication pages (login, register, etc.)
 * No sidebar or header - centered, minimal design
 */

export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Radio Management
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            Professional platform for radio stations
          </p>
        </div>

        {/* Auth Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-600">
          <p>© 2024 Radio Management System. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
