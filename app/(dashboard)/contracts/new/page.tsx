/**
 * Create Contract Page
 * Form to create a new contract
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Loader,
} from 'lucide-react'
import { createContract, type ContractResponse } from '@/app/actions/contracts'

interface ContractFormData {
  contractNumber: string
  clientId: string
  title: string
  description: string
  startDate: string
  endDate: string
  value: string
  terms: string
  documentUrl: string
}

interface FormState {
  loading: boolean
  error: string | null
  submitting: boolean
  clientsLoading: boolean
}

interface Client {
  id: string
  name: string
}

export default function CreateContractPage() {
  const router = useRouter()
  const [formState, setFormState] = useState<FormState>({
    loading: false,
    error: null,
    submitting: false,
    clientsLoading: true,
  })
  const [clients, setClients] = useState<Client[]>([])

  const [formData, setFormData] = useState<ContractFormData>({
    contractNumber: '',
    clientId: '',
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: '',
    terms: '',
    documentUrl: '',
  })

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients')
        if (!response.ok) throw new Error('Failed to fetch clients')
        const data = await response.json()
        setClients(data.data || [])
      } catch (error) {
        console.error('Failed to load clients:', error)
        setFormState((prev) => ({
          ...prev,
          error: 'Failed to load clients',
        }))
      } finally {
        setFormState((prev) => ({
          ...prev,
          clientsLoading: false,
        }))
      }
    }

    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState((prev) => ({ ...prev, submitting: true, error: null }))

    try {
      // Validate required fields
      if (!formData.contractNumber) {
        throw new Error('Contract number is required')
      }
      if (!formData.clientId) {
        throw new Error('Please select a client')
      }
      if (!formData.title) {
        throw new Error('Contract title is required')
      }
      if (!formData.value) {
        throw new Error('Contract value is required')
      }

      const response = await createContract({
        contractNumber: formData.contractNumber,
        clientId: formData.clientId,
        title: formData.title,
        description: formData.description || null,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        value: parseFloat(formData.value) || 0,
        terms: formData.terms || null,
        documentUrl: formData.documentUrl || null,
      })

      // Redirect to contract detail page
      router.push(`/contracts/${response.id}`)
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create contract',
      }))
    } finally {
      setFormState((prev) => ({ ...prev, submitting: false }))
    }
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
            href="/contracts"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Contracts
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Create Contract
          </h1>
          <p className="text-slate-400 mt-2">Add a new contract with terms and conditions</p>
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
                    Contract Number *
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
                    placeholder="e.g., CT-2024-001"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                    required
                  />
                </div>

                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Client *
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clientId: e.target.value,
                      }))
                    }
                    disabled={formState.clientsLoading}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="" className="bg-slate-900">
                      {formState.clientsLoading ? 'Loading clients...' : 'Select a client...'}
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="bg-slate-900">
                        {client.name}
                      </option>
                    ))}
                  </select>
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
                  placeholder="e.g., Service Agreement 2024"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Add contract details and description..."
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
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                  required
                />
              </div>

              {/* Terms */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Terms & Conditions (Optional)
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      terms: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Add contract terms, conditions, and important notes..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur resize-none"
                />
              </div>

              {/* Document URL */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Document URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.documentUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      documentUrl: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <Link
                href="/contracts"
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
                    Creating...
                  </>
                ) : (
                  'Create Contract'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
