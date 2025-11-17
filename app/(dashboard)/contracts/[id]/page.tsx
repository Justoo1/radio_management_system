/**
 * Contract Detail Page
 * View contract details and manage status
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  FileText,
  User,
  DollarSign,
  Calendar,
  FileCheck,
  Loader,
  Edit,
  Trash2,
} from 'lucide-react'
import { fetchContractDetails, updateContract, deleteContract, type ContractResponse } from '@/app/actions/contracts'

interface PageState {
  contract: ContractResponse | null
  loading: boolean
  error: string | null
  updating: boolean
  newStatus: string
}

const statusOptions = ['DRAFT', 'PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED']

export default function ContractDetailPage() {
  const router = useRouter()
  const params = useParams()
  const contractId = params.id as string

  const [state, setState] = useState<PageState>({
    contract: null,
    loading: true,
    error: null,
    updating: false,
    newStatus: '',
  })

  // Load contract details
  useEffect(() => {
    const loadContract = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))
        const contract = await fetchContractDetails(contractId)
        setState((prev) => ({
          ...prev,
          contract,
          newStatus: contract.status,
          loading: false,
        }))
      } catch (error) {
        setState((prev) => ({
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

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!state.contract || state.newStatus === state.contract.status) {
      return
    }

    try {
      setState((prev) => ({ ...prev, updating: true, error: null }))
      await updateContract(contractId, {
        status: state.newStatus as any,
      })
      setState((prev) => ({
        ...prev,
        contract: prev.contract
          ? {
              ...prev.contract,
              status: state.newStatus as any,
            }
          : null,
        updating: false,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update status',
        updating: false,
      }))
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this contract? This action cannot be undone.')) {
      try {
        await deleteContract(contractId)
        router.push('/contracts')
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to delete contract',
        }))
      }
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'from-slate-400 to-slate-600 shadow-slate-500/50',
      PENDING: 'from-yellow-400 to-yellow-600 shadow-yellow-500/50',
      ACTIVE: 'from-green-400 to-green-600 shadow-green-500/50',
      EXPIRED: 'from-red-400 to-red-600 shadow-red-500/50',
      TERMINATED: 'from-gray-400 to-gray-600 shadow-gray-500/50',
    }
    return colors[status] || colors.DRAFT
  }

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-blue-400"></div>
          <p className="text-slate-400">Loading contract...</p>
        </div>
      </div>
    )
  }

  if (!state.contract) {
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
            {state.error || 'Contract not found'}
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
            href="/contracts"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Contracts
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">
                {state.contract.title}
              </h1>
              <p className="text-slate-400 mt-2">
                Contract #{state.contract.contractNumber}
              </p>
            </div>
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${getStatusColor(state.contract.status)} text-white shadow-md h-fit`}>
              {state.contract.status}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg mb-8 backdrop-blur">
            {state.error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Details Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Contract Information</h2>

              <div className="space-y-4">
                {/* Client */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-slate-400" />
                    <label className="text-sm font-medium text-slate-400">Client</label>
                  </div>
                  <p className="text-white ml-7 font-medium">{state.contract.client?.name || 'Unknown'}</p>
                  {state.contract.client?.email && (
                    <p className="text-slate-400 ml-7 text-sm">{state.contract.client.email}</p>
                  )}
                </div>

                {/* Description */}
                {state.contract.description && (
                  <div>
                    <label className="text-sm font-medium text-slate-400 block mb-2">Description</label>
                    <p className="text-slate-200 whitespace-pre-wrap">{state.contract.description}</p>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <label className="text-sm font-medium text-slate-400">Start Date</label>
                    </div>
                    <p className="text-white ml-7 font-medium">{formatDate(state.contract.startDate)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <label className="text-sm font-medium text-slate-400">End Date</label>
                    </div>
                    <p className="text-white ml-7 font-medium">{formatDate(state.contract.endDate)}</p>
                  </div>
                </div>

                {/* Value */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-slate-400" />
                    <label className="text-sm font-medium text-slate-400">Contract Value</label>
                  </div>
                  <p className="text-white ml-7 font-bold text-lg">{formatCurrency(Number(state.contract.value))}</p>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            {state.contract.terms && (
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Terms & Conditions</h2>
                <p className="text-slate-200 whitespace-pre-wrap">{state.contract.terms}</p>
              </div>
            )}

            {/* Documents */}
            {(state.contract.documentUrl || state.contract.signedDocumentUrl) && (
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Documents
                </h2>

                <div className="space-y-3">
                  {state.contract.documentUrl && (
                    <a
                      href={state.contract.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <FileText className="w-5 h-5 text-blue-300" />
                      <div className="flex-1">
                        <p className="text-white font-medium">Contract Document</p>
                        <p className="text-slate-400 text-sm">Original contract document</p>
                      </div>
                    </a>
                  )}

                  {state.contract.signedDocumentUrl && (
                    <a
                      href={state.contract.signedDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <FileCheck className="w-5 h-5 text-green-300" />
                      <div className="flex-1">
                        <p className="text-white font-medium">Signed Document</p>
                        <p className="text-slate-400 text-sm">Signed on {state.contract.signedAt ? formatDate(state.contract.signedAt) : 'N/A'}</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Status</h3>

              <div className="space-y-4">
                <select
                  value={state.newStatus}
                  onChange={(e) => setState((prev) => ({ ...prev, newStatus: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status} className="bg-slate-900">
                      {status}
                    </option>
                  ))}
                </select>

                {state.newStatus !== state.contract.status && (
                  <button
                    onClick={handleStatusUpdate}
                    disabled={state.updating}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.updating ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Status'
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>

              <div className="space-y-3">
                {state.contract.status === 'DRAFT' && (
                  <Link
                    href={`/contracts/${state.contract.id}/edit`}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Contract
                  </Link>
                )}

                {state.contract.status === 'DRAFT' && (
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/50 text-red-200 rounded-lg hover:from-red-500/30 hover:to-red-600/30 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Contract
                  </button>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Additional Info</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400">Created</p>
                  <p className="text-white font-medium">{formatDate(state.contract.createdAt)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Last Updated</p>
                  <p className="text-white font-medium">{formatDate(state.contract.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
