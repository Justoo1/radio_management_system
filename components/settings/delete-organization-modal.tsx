/**
 * Delete Organization Modal Component
 * Confirmation dialog for irreversible organization deletion
 */

'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { AlertCircle, Trash2, X } from 'lucide-react'
import { deleteOrganization } from '@/app/actions/organization'

interface DeleteOrganizationModalProps {
  isOpen: boolean
  organizationName: string
  onClose: () => void
  onSuccess: () => void
}

interface FormErrors {
  [key: string]: string
}

export function DeleteOrganizationModal({
  isOpen,
  organizationName,
  onClose,
  onSuccess,
}: DeleteOrganizationModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    organizationNameConfirmation: '',
    agreeToDelete: false,
    agreeToDataLoss: false,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const isFormValid =
    formData.organizationNameConfirmation === organizationName &&
    formData.agreeToDelete &&
    formData.agreeToDataLoss

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await deleteOrganization({
        organizationNameConfirmation: formData.organizationNameConfirmation,
        agreeToDelete: formData.agreeToDelete,
        agreeToDataLoss: formData.agreeToDataLoss,
      })

      if (result.success) {
        // Sign out the user and clear authentication cookies
        await signOut({ redirect: true, callbackUrl: '/auth/login' })
        // The signOut will handle the redirect, but call onSuccess as backup
        onSuccess()
      } else {
        setError(result.error || result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-red-500/30 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-semibold text-white">Delete Organization</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning Message */}
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">
              <span className="font-semibold">Warning:</span> This action cannot be undone. All data
              associated with this organization will be permanently deleted.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Organization Name Confirmation */}
          <div>
            <label htmlFor="confirmation" className="block text-sm font-medium text-slate-300 mb-2">
              Type the organization name to confirm:
            </label>
            <div className="relative">
              <input
                id="confirmation"
                type="text"
                name="organizationNameConfirmation"
                value={formData.organizationNameConfirmation}
                onChange={handleChange}
                placeholder={organizationName}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all"
              />
              {formData.organizationNameConfirmation === organizationName && (
                <div className="absolute right-3 top-3 text-emerald-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Expected: <span className="font-mono font-semibold">{organizationName}</span>
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreeToDelete"
                checked={formData.agreeToDelete}
                onChange={handleChange}
                className="w-4 h-4 rounded border-white/30 text-red-600 bg-white/10 cursor-pointer"
              />
              <span className="text-sm text-slate-300">
                I understand this action is <span className="font-semibold">irreversible</span>
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreeToDataLoss"
                checked={formData.agreeToDataLoss}
                onChange={handleChange}
                className="w-4 h-4 rounded border-white/30 text-red-600 bg-white/10 cursor-pointer"
              />
              <span className="text-sm text-slate-300">
                I acknowledge that <span className="font-semibold">all data will be permanently deleted</span>
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {loading ? 'Deleting...' : 'Delete Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
