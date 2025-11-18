'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createExpense } from '@/app/actions/expenses'
import { Button } from '@/components/ui/button'
import type { CreateExpenseInput } from '@/lib/validations/expense'

interface CreateExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function CreateExpenseModal({ open, onOpenChange, onSuccess }: CreateExpenseModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'RECORDED',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload: CreateExpenseInput = {
        category: formData.category,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
        expenseDate: new Date(formData.expenseDate),
        notes: formData.notes || undefined,
        status: (formData.status as 'RECORDED' | 'APPROVED' | 'PAID' | 'CANCELLED') || 'RECORDED',
      }

      await createExpense(payload)
      onOpenChange(false)
      setFormData({
        category: '',
        description: '',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'RECORDED',
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expense')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-xl border border-white/20 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Create New Expense</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">{error}</div>}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category *</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Salary, Rent, Utilities"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Amount *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Expense Date *</label>
            <input
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="RECORDED">Recorded</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 border-0"
            >
              {loading ? 'Creating...' : 'Create Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
