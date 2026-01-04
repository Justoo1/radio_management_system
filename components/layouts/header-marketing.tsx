/**
 * Marketing Header Component
 * Navigation header for public/marketing pages
 */

'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Menu, X, Shield } from 'lucide-react'

export default function HeaderMarketing() {
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showAdminAccess, setShowAdminAccess] = useState(false)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  // Long press on header to reveal admin access (3 seconds)
  const handlePressStart = () => {
    setIsLongPressing(true)

    longPressTimer.current = setTimeout(() => {
      setShowAdminAccess(true)
      setIsLongPressing(false)
      // Auto-hide after 10 minutes
      setTimeout(() => setShowAdminAccess(false), 10 * 60 * 1000)
    }, 3000)
  }

  const handlePressEnd = () => {
    setIsLongPressing(false)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  return (
    <>
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-4 relative"
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
      >
        {/* Long press visual feedback */}
        {isLongPressing && (
          <div className="absolute inset-0 border-2 border-purple-500 rounded-lg animate-pulse pointer-events-none"></div>
        )}

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group z-10">
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
        <nav className="hidden md:flex items-center gap-8 z-10">
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
        <div className="hidden md:flex items-center gap-4 z-10">
          {/* Admin Access Button - Hidden until activated */}
          {showAdminAccess && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold animate-fade-in"
            >
              <Shield size={16} />
              <span>Admin</span>
            </Link>
          )}

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
          className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition z-10"
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
              {/* Admin Access - Mobile */}
              {showAdminAccess && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
                >
                  <Shield size={16} />
                  Admin Access
                </Link>
              )}

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

      {/* Long Press Progress Indicator */}
      {isLongPressing && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-fade-in">
          <p className="text-sm font-medium flex items-center gap-2">
            <Shield size={16} className="animate-pulse" />
            Hold for 3 seconds to enable admin access...
          </p>
        </div>
      )}

      {/* Admin Access Enabled Toast */}
      {showAdminAccess && !isLongPressing && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-fade-in">
          <p className="text-sm font-medium flex items-center gap-2">
            <Shield size={16} />
            Admin access enabled! Check navigation menu.
          </p>
        </div>
      )}
    </>
  )
}
