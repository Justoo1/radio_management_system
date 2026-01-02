/**
 * Expenses Management Page
 * List all expenses with filtering, search, and summary metrics
 */

'use client'

import { FeatureGuard } from '@/components/feature-guard'
import { Feature } from '@/lib/features'
import { useEffect, useState } from 'react'
import {
  DollarSign,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  Tag,
} from 'lucide-react'
import { fetchExpenses, deleteExpense, type ExpenseResponse, getExpenseCategories } from '@/app/actions/expenses'
import { Button } from '@/components/ui/button'
import CreateExpenseModal from '@/components/expenses/create-expense-modal'
import EditExpenseModal from '@/components/expenses/edit-expense-modal'

interface ExpensesPageState {
  expenses: ExpenseResponse[]
  summary: {
    totalExpenses: number
    totalAmount: number
    averageAmount: number
    byCategory: Record<string, number>
  } | null
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  } | null
  loading: boolean
  error: string | null
  filters: {
    search: string
    status: string
    category: string
    page: number
    pageSize: number
  }
  categories: string[]
}

export default function ExpensesPage() {
  return (
    <FeatureGuard
      feature={Feature.EXPENSES}
      featureDescription="Track and manage your organization expenses with detailed reporting"
    >
      <ExpensesContent />
    </FeatureGuard>
  )
}

function ExpensesContent() {
  const [state, setState] = useState<ExpensesPageState>({
    expenses: [],
    summary: null,
    pagination: null,
    loading: true,
    error: null,
    filters: {
      search: '',
      status: '',
      category: '',
      page: 1,
      pageSize: 10,
    },
    categories: [],
  })

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null)

  // Load expense categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getExpenseCategories()
        setState((prev) => ({ ...prev, categories: cats }))
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    loadCategories()
  }, [])

  // Load expenses
  const loadExpenses = async (filters = state.filters) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const response = await fetchExpenses({
        page: filters.page,
        pageSize: filters.pageSize,
        ...(filters.status && { status: filters.status as 'RECORDED' | 'APPROVED' | 'PAID' | 'CANCELLED' }),
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
      })

      setState((prev) => ({
        ...prev,
        expenses: response.data,
        summary: response.summary,
        pagination: response.pagination,
        loading: false,
        filters,
      }))
    } catch (error) {
      console.error('Failed to load expenses:', error)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load expenses',
      }))
    }
  }

  // Initial load
  useEffect(() => {
    loadExpenses()
  }, [])

  // Handle search
  const handleSearch = (value: string) => {
    const newFilters = { ...state.filters, search: value, page: 1 }
    setState((prev) => ({ ...prev, filters: newFilters }))
    loadExpenses(newFilters)
  }

  // Handle status filter
  const handleStatusFilter = (value: string) => {
    const newFilters = { ...state.filters, status: value, page: 1 }
    setState((prev) => ({ ...prev, filters: newFilters }))
    loadExpenses(newFilters)
  }

  // Handle category filter
  const handleCategoryFilter = (value: string) => {
    const newFilters = { ...state.filters, category: value, page: 1 }
    setState((prev) => ({ ...prev, filters: newFilters }))
    loadExpenses(newFilters)
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const newFilters = { ...state.filters, page: newPage }
    setState((prev) => ({ ...prev, filters: newFilters }))
    loadExpenses(newFilters)
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      await deleteExpense(id)
      setState((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== id),
      }))
      await loadExpenses(state.filters)
    } catch (error) {
      console.error('Failed to delete expense:', error)
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete expense',
      }))
    }
  }

  // Handle create/edit success
  const handleExpenseSaved = () => {
    setShowCreateModal(false)
    setEditingExpense(null)
    loadExpenses(state.filters)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECORDED':
        return 'bg-blue-500/20 text-blue-300'
      case 'APPROVED':
        return 'bg-purple-500/20 text-purple-300'
      case 'PAID':
        return 'bg-emerald-500/20 text-emerald-300'
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-300'
      default:
        return 'bg-slate-500/20 text-slate-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Expenses</h1>
          <p className="text-slate-400 mt-1">Track and manage your organization expenses</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 hover:shadow-lg hover:shadow-blue-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Expense
        </Button>
      </div>

      {/* Summary Cards */}
      {state.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Expenses</p>
                <p className="text-3xl font-bold text-white mt-2">${(state.summary.totalAmount / 1000).toFixed(1)}K</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Number of Expenses</p>
                <p className="text-3xl font-bold text-white mt-2">{state.summary.totalExpenses}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Average Expense</p>
                <p className="text-3xl font-bold text-white mt-2">${(state.summary.averageAmount / 1000).toFixed(1)}K</p>
              </div>
              <Tag className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {state.error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">{state.error}</div>
      )}

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by category, description..."
                value={state.filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <select
            value={state.filters.status}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="RECORDED">Recorded</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={state.filters.category}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {state.categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden">
        {state.loading ? (
          <div className="p-8 text-center">
            <p className="text-slate-400">Loading expenses...</p>
          </div>
        ) : state.expenses.length === 0 ? (
          <div className="p-8 text-center">
            <TrendingDown className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400">No expenses found. Create one to get started!</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {state.expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{expense.category}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{expense.description || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="text-white font-semibold">${Number(expense.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 opacity-50" />
                        {new Date(expense.expenseDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingExpense(expense)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {state.pagination && state.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  Showing {(state.filters.page - 1) * state.filters.pageSize + 1} to{' '}
                  {Math.min(state.filters.page * state.filters.pageSize, state.pagination.total)} of{' '}
                  {state.pagination.total} expenses
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePageChange(state.filters.page - 1)}
                    disabled={state.filters.page === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => handlePageChange(state.filters.page + 1)}
                    disabled={!state.pagination.hasMore}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreateExpenseModal open={showCreateModal} onOpenChange={setShowCreateModal} onSuccess={handleExpenseSaved} />
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          onSuccess={handleExpenseSaved}
        />
      )}
    </div>
  )
}
