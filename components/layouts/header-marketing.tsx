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
      <Link href="/" className="text-2xl font-bold text-slate-900">
        RadioMgmt
      </Link>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-slate-600 hover:text-slate-900 transition">
          Home
        </Link>
        <Link href="/pricing" className="text-slate-600 hover:text-slate-900 transition">
          Pricing
        </Link>
        <Link href="/features" className="text-slate-600 hover:text-slate-900 transition">
          Features
        </Link>
        <Link href="/about" className="text-slate-600 hover:text-slate-900 transition">
          About
        </Link>
      </nav>

      {/* Auth Links */}
      <div className="flex items-center gap-4">
        {session ? (
          <Link
            href="/dashboard"
            className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="text-slate-600 hover:text-slate-900 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
