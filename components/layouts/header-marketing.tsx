/**
 * Marketing Header Component
 * Navigation header for public/marketing pages
 */

'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function HeaderMarketing() {
  const { data: session } = useSession()

  return (
    <div className="flex items-center justify-between px-6 py-4">
      {/* Logo */}
      <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
        RadioMgmt
      </Link>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-slate-600 hover:text-purple-600 transition font-medium">
          Home
        </Link>
        <Link href="/pricing" className="text-slate-600 hover:text-purple-600 transition font-medium">
          Pricing
        </Link>
        <Link href="/features" className="text-slate-600 hover:text-purple-600 transition font-medium">
          Features
        </Link>
        <Link href="/about" className="text-slate-600 hover:text-purple-600 transition font-medium">
          About
        </Link>
      </nav>

      {/* Auth Links */}
      <div className="flex items-center gap-4">
        {session ? (
          <Link
            href="/dashboard"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 font-semibold"
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="text-slate-600 hover:text-purple-600 transition font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 font-semibold"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
