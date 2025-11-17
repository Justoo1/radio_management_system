/**
 * Edit Contract Page
 * Edit an existing contract (draft only)
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Loader,
} from 'lucide-react'
import { fetchContractDetails, updateContract, type ContractResponse } from '@/app/actions/contracts'

interface ContractFormData {
  contractNumber: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  value: string
  terms: string | null
  documentUrl: string | null
}

interface FormState {
  loading: boolean
  error: string | null
  submitting: boolean
}

export default function EditContractPage() {
  const router = useRouter()
  const params = useParams()
  const contractId = params.id as string

  const [formState, setFormState] = useState<FormState>({
    loading: true,
    error: null,
    submitting: false,
  })

  const [contract, setContract] = useState<ContractResponse | null>(null)
  const [formData, setFormData] = useState<ContractFormData>({
    contractNumber: '',
    title: '',
    description: null,
    startDate: '',
    endDate: '',
    value: '',
    terms: null,
    documentUrl: null,
  })

  // Load contract details
  useEffect(() => {
    const loadContract = async () => {
      try {
        setFormState((prev) => ({ ...prev, loading: true, error: null }))
        const data = await fetchContractDetails(contractId)
        setContract(data)
        setFormData({
          contractNumber: data.contractNumber,
          title: data.title,
          description: data.description,
          startDate: data.startDate.toISOString().split('T')[0],
          endDate: data.endDate.toISOString().split('T')[0],
          value: data.value.toString(),
          terms: data.terms,
          documentUrl: data.documentUrl,
        })
        setFormState((prev) => ({ ...prev, loading: false }))
      } catch (error) {
        setFormState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load contract',
          loading: false,
        }))
      }
    }

    if (contractId) {
      loadContract()
    }
  }, [contractId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState((prev) => ({ ...prev, submitting: true, error: null }))

    try {
      // Validate required fields
      if (!formData.title) {
        throw new Error('Contract title is required')
      }
      if (!formData.value) {
        throw new Error('Contract value is required')
      }

      await updateContract(contractId, {
        contractNumber: formData.contractNumber,
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        value: parseFloat(formData.value) || 0,
        terms: formData.terms,
        documentUrl: formData.documentUrl,
      })

      // Redirect to contract detail page
      router.push(`/contracts/${contractId}`)
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update contract',
      }))
    } finally {
      setFormState((prev) => ({ ...prev, submitting: false }))
    }
  }

  if (formState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-blue-400"></div>
          <p className="text-slate-400">Loading contract...</p>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 p-6 md:p-8">
          <Link
            href="/contracts"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Contracts
          </Link>
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg backdrop-blur">
            {formState.error || 'Contract not found'}
          </div>
        </div>
      </div>
    )
  }

  // Only allow editing of draft contracts
  if (contract.status !== 'DRAFT') {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 p-6 md:p-8">
          <Link
            href={`/contracts/${contractId}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Contract
          </Link>
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg backdrop-blur">
            Only draft contracts can be edited. Current status: {contract.status}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/contracts/${contractId}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Contract
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Edit Contract
          </h1>
          <p className="text-slate-400 mt-2">Update contract details</p>
        </div>

        {/* Error Message */}
        {formState.error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg mb-8 backdrop-blur">
            {formState.error}
          </div>
        )}

        {/* Form Container */}
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contract Details Section */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Contract Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Contract Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Contract Number
                  </label>
                  <input
                    type="text"
                    value={formData.contractNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contractNumber: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contract Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value || null,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                    required
                  />
                </div>
              </div>

              {/* Value */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contract Value *
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                  required
                />
              </div>

              {/* Terms */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  value={formData.terms || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      terms: e.target.value || null,
                    }))
                  }
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur resize-none"
                />
              </div>

              {/* Document URL */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Document URL
                </label>
                <input
                  type="url"
                  value={formData.documentUrl || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      documentUrl: e.target.value || null,
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <Link
                href={`/contracts/${contractId}`}
                className="px-6 py-3 bg-white/5 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-all duration-200 font-medium"
              >
                Cancel
              </Link>
              <button
                onClick={handleSubmit}
                disabled={formState.submitting}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/50 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formState.submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Contract'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
