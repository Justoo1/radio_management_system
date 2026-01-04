/**
 * Marketing Header Component
 * Navigation header for public/marketing pages
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Menu, X } from 'lucide-react'

export default function HeaderMarketing() {
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.svg"
            alt="Radio Management System"
            width={40}
            height={40}
            className="flex-shrink-0"
          />
          <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hidden sm:inline">
            Radio Management System
          </span>
          <span className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent sm:hidden">
            RMS
          </span>
        </Link>

        {/* Desktop Navigation Links */}
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

        {/* Desktop Auth Links */}
        <div className="hidden md:flex items-center gap-4">
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
          <nav className="flex flex-col px-4 py-4 space-y-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition font-medium"
            >
              Home
            </Link>
            <Link
              href="/pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition font-medium"
            >
              Pricing
            </Link>
            <Link
              href="/features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition font-medium"
            >
              Features
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition font-medium"
            >
              About
            </Link>

            {/* Mobile Auth Links */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              {session ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 font-semibold"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center px-4 py-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 font-semibold"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
