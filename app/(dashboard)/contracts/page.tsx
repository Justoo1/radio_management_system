/**
 * Contracts Management Page
 * List all contracts with filtering, search, and summary metrics
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import { fetchContracts, deleteContract, type ContractResponse } from '@/app/actions/contracts'

interface ContractsPageState {
  contracts: ContractResponse[]
  summary: {
    totalContracts: number
    totalValue: number
    activeCount: number
    expiredCount: number
  } | null
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  } | null
  loading: boolean
  error: string | null
  filters: {
    search: string
    status: string
    page: number
    pageSize: number
  }
}

export default function ContractsPage() {
  const [state, setState] = useState<ContractsPageState>({
    contracts: [],
    summary: null,
    pagination: null,
    loading: true,
    error: null,
    filters: {
      search: '',
      status: '',
      page: 1,
      pageSize: 10,
    },
  })

  // Load contracts
  const loadContracts = async (filters = state.filters) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const response = await fetchContracts({
        page: filters.page,
        pageSize: filters.pageSize,
        ...(filters.status && { status: filters.status as 'DRAFT' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' }),
        ...(filters.search && { search: filters.search }),
      })

      setState((prev) => ({
        ...prev,
        contracts: response.data,
        summary: response.summary,
        pagination: response.pagination,
        loading: false,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load contracts',
        loading: false,
      }))
    }
  }

  // Initial load
  useEffect(() => {
    loadContracts()
  }, [])

  // Handle search
  const handleSearch = (value: string) => {
    const newFilters = { ...state.filters, search: value, page: 1 }
    setState((prev) => ({ ...prev, filters: newFilters }))
    loadContracts(newFilters)
  }

  // Handle status filter
  const handleStatusFilter = (value: string) => {
    const newFilters = { ...state.filters, status: value, page: 1 }
    setState((prev) => ({ ...prev, filters: newFilters }))
    loadContracts(newFilters)
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (state.pagination && newPage > 0 && newPage <= state.pagination.totalPages) {
      const newFilters = { ...state.filters, page: newPage }
      setState((prev) => ({ ...prev, filters: newFilters }))
      loadContracts(newFilters)
    }
  }

  // Handle delete
  const handleDelete = async (contractId: string, contractNumber: string) => {
    if (confirm(`Are you sure you want to delete contract ${contractNumber}?`)) {
      try {
        await deleteContract(contractId)
        loadContracts(state.filters)
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
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  }

  // Get status badge gradient
  const getStatusGradient = (status: string): string => {
    const gradients: Record<string, string> = {
      DRAFT: 'from-slate-400 to-slate-600 shadow-slate-500/50',
      PENDING: 'from-yellow-400 to-yellow-600 shadow-yellow-500/50',
      ACTIVE: 'from-green-400 to-green-600 shadow-green-500/50',
      EXPIRED: 'from-red-400 to-red-600 shadow-red-500/50',
      TERMINATED: 'from-gray-400 to-gray-600 shadow-gray-500/50',
    }
    return gradients[status] || gradients.DRAFT
  }

  return (
    <div className="min-h-screen">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Contracts
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage and track your contracts
              </p>
            </div>
            <Link
              href="/contracts/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/50 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Contract
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        {state.summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Contracts */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-500/30 to-blue-600/30 p-3 rounded-xl border border-blue-400/30 backdrop-blur">
                    <FileText className="w-6 h-6 text-blue-300" />
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Contracts</p>
                <p className="text-4xl font-bold text-white">
                  {state.summary.totalContracts}
                </p>
              </div>
            </div>

            {/* Total Value */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-emerald-500/30 to-cyan-600/30 p-3 rounded-xl border border-emerald-400/30 backdrop-blur">
                    <DollarSign className="w-6 h-6 text-emerald-300" />
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Value</p>
                <p className="text-4xl font-bold text-white">
                  {formatCurrency(state.summary.totalValue)}
                </p>
              </div>
            </div>

            {/* Active Contracts */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-green-500/30 to-emerald-600/30 p-3 rounded-xl border border-green-400/30 backdrop-blur">
                    <CheckCircle className="w-6 h-6 text-green-300" />
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">Active</p>
                <p className="text-4xl font-bold text-green-300">
                  {state.summary.activeCount}
                </p>
              </div>
            </div>

            {/* Expired Contracts */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-red-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-red-500/30 to-pink-600/30 p-3 rounded-xl border border-red-400/30 backdrop-blur">
                    <AlertCircle className="w-6 h-6 text-red-300" />
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">Expired</p>
                <p className="text-4xl font-bold text-red-300">
                  {state.summary.expiredCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search contracts..."
                value={state.filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={state.filters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-medium backdrop-blur"
              >
                <option value="" className="bg-slate-900 text-white">All Statuses</option>
                <option value="DRAFT" className="bg-slate-900 text-white">Draft</option>
                <option value="PENDING" className="bg-slate-900 text-white">Pending</option>
                <option value="ACTIVE" className="bg-slate-900 text-white">Active</option>
                <option value="EXPIRED" className="bg-slate-900 text-white">Expired</option>
                <option value="TERMINATED" className="bg-slate-900 text-white">Terminated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-8 backdrop-blur">
            {state.error}
          </div>
        )}

        {/* Contracts Table */}
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          {state.loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-600 border-t-blue-400"></div>
                <p className="text-slate-400">Loading contracts...</p>
              </div>
            </div>
          ) : state.contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mb-4 border border-white/20">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-white text-lg font-medium">No contracts found</p>
              <p className="text-slate-400 text-sm mt-1">
                Create your first contract to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-gradient-to-r from-white/5 to-white/0">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Contract #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Value
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      End Date
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.contracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-white bg-white/10 px-3 py-1 rounded-lg text-sm border border-white/20">
                          {contract.contractNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-200 font-medium">
                          {contract.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-200">
                          {contract.client?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        {formatCurrency(Number(contract.value))}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${getStatusGradient(
                            contract.status
                          )} text-white shadow-md`}
                        >
                          {contract.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        {formatDate(contract.endDate)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/contracts/${contract.id}`}
                            title="View contract"
                            className="p-2.5 hover:bg-blue-500/20 rounded-lg transition-all duration-200 text-blue-300 hover:text-blue-200 border border-transparent hover:border-blue-500/50"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {contract.status === 'DRAFT' && (
                            <Link
                              href={`/contracts/${contract.id}/edit`}
                              title="Edit contract"
                              className="p-2.5 hover:bg-purple-500/20 rounded-lg transition-all duration-200 text-purple-300 hover:text-purple-200 border border-transparent hover:border-purple-500/50"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          )}
                          {contract.status === 'DRAFT' && (
                            <button
                              onClick={() =>
                                handleDelete(contract.id, contract.contractNumber)
                              }
                              title="Delete contract"
                              className="p-2.5 hover:bg-red-500/20 rounded-lg transition-all duration-200 text-red-300 hover:text-red-200 border border-transparent hover:border-red-500/50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {state.pagination && state.pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">
              Page <span className="text-white font-bold">{state.pagination.page}</span> of{' '}
              <span className="text-white font-bold">{state.pagination.totalPages}</span> (
              <span className="text-white font-bold">{state.pagination.total}</span> total contracts)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handlePageChange(state.pagination!.page - 1)}
                disabled={state.pagination.page === 1}
                className="px-4 py-2.5 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-medium text-slate-300 hover:text-white"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(state.pagination!.page + 1)}
                disabled={!state.pagination.hasNext}
                className="px-4 py-2.5 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-medium text-slate-300 hover:text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
