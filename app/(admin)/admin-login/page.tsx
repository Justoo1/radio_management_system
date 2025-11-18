/**
 * Developer Authentication Page
 * Allows developers to gain access to admin dashboard with security key
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, Lock, ArrowRight, LogOut } from 'lucide-react'
import { verifyDeveloperAccess, checkDeveloperAccess, revokeDeveloperAccess } from '@/app/actions/developer'

export default function DeveloperLoginPage() {
  const router = useRouter()
  const [developerKey, setDeveloperKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasDeveloperAccess, setHasDeveloperAccess] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)

  // Check if user already has developer access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const hasAccess = await checkDeveloperAccess()
        setHasDeveloperAccess(hasAccess)
      } catch (err) {
        console.error('Error checking developer access:', err)
      } finally {
        setCheckingAccess(false)
      }
    }

    checkAccess()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await verifyDeveloperAccess(developerKey)

      if (result.success) {
        setSuccess(true)
        setDeveloperKey('')
        setHasDeveloperAccess(true)

        // Redirect to admin dashboard after 1.5 seconds
        setTimeout(() => {
          router.push('/admin')
        }, 1500)
      } else {
        setError(result.message || 'Invalid developer key')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async () => {
    try {
      await revokeDeveloperAccess()
      setHasDeveloperAccess(false)
      setSuccess(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke access')
    }
  }

  if (checkingAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Checking access...</p>
        </div>
      </div>
    )
  }

  if (hasDeveloperAccess && success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full mx-auto p-8 bg-slate-900 rounded-2xl border border-emerald-500/30 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Granted</h2>
          <p className="text-slate-400 mb-6">
            Your developer access has been verified. Redirecting to admin dashboard...
          </p>
          <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md w-full mx-auto p-8 bg-slate-900 rounded-2xl border border-slate-700/50">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-600/20 rounded-lg">
            <Lock className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Developer Access</h1>
            <p className="text-sm text-slate-400">Admin Dashboard</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-slate-300 mb-2">
              Key
            </label>
            <input
              id="key"
              type="password"
              value={developerKey}
              onChange={(e) => setDeveloperKey(e.target.value)}
              placeholder="Enter key"
              disabled={loading}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !developerKey.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify Access
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 text-center">
            Developers only. Access tokens expire after 24 hours.
          </p>
        </div>

        {/* Revoke Access Button - Only show if has access */}
        {hasDeveloperAccess && !success && (
          <button
            onClick={handleRevoke}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            Revoke Access
          </button>
        )}
      </div>
    </div>
  )
}
