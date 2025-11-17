/**
 * Invoice Edit Page
 * Edit draft invoice details
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Plus,
  Trash2,
  Loader,
  AlertCircle,
} from 'lucide-react'
import { fetchInvoiceDetails, updateInvoice, type InvoiceResponse } from '@/app/actions/financial'

interface InvoiceFormData {
  clientId: string
  contractId: string | null
  issueDate: string
  dueDate: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: string
  }>
  subtotal: string
  taxAmount: string
  discount: string
  notes: string
}

interface FormState {
  loading: boolean
  error: string | null
  submitting: boolean
  clientsLoading: boolean
  contractsLoading: boolean
}

interface Client {
  id: string
  name: string
}

interface Contract {
  id: string
  contractNumber: string
  title: string
  value: number
}

export default function InvoiceEditPage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    contractId: null,
    issueDate: '',
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: '' }],
    subtotal: '',
    taxAmount: '',
    discount: '',
    notes: '',
  })
  const [state, setState] = useState<FormState>({
    loading: true,
    error: null,
    submitting: false,
    clientsLoading: true,
    contractsLoading: false,
  })

  // Load invoice details and clients
  useEffect(() => {
    const loadData = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))

        const [invoiceData, clientsResponse] = await Promise.all([
          fetchInvoiceDetails(invoiceId),
          fetch('/api/clients').then((res) => res.json()),
        ])

        if (!invoiceData) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Invoice not found',
          }))
          return
        }

        // Check if invoice is draft
        if (invoiceData.status !== 'DRAFT') {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Only draft invoices can be edited',
          }))
          return
        }

        setInvoice(invoiceData)
        setClients(clientsResponse.data || [])

        // Format dates for input
        const issueDate = new Date(invoiceData.issueDate)
        const dueDate = new Date(invoiceData.dueDate)

        const formattedIssueDate = issueDate.toISOString().split('T')[0]
        const formattedDueDate = dueDate.toISOString().split('T')[0]

        // Populate form with invoice data
        setFormData({
          clientId: invoiceData.clientId,
          contractId: invoiceData.contractId || null,
          issueDate: formattedIssueDate,
          dueDate: formattedDueDate,
          items:
            invoiceData.items?.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice.toString(),
            })) || [],
          subtotal: invoiceData.subtotal.toString(),
          taxAmount: invoiceData.taxAmount?.toString() || '0',
          discount: invoiceData.discount?.toString() || '0',
          notes: invoiceData.notes || '',
        })

        setState((prev) => ({
          ...prev,
          loading: false,
          clientsLoading: false,
        }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          clientsLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load data',
        }))
      }
    }

    loadData()
  }, [invoiceId])

  // Load contracts when client changes
  useEffect(() => {
    if (!formData.clientId) {
      setContracts([])
      return
    }

    const loadContracts = async () => {
      setState((prev) => ({ ...prev, contractsLoading: true }))
      try {
        const response = await fetch(`/api/contracts?clientId=${formData.clientId}`)
        if (!response.ok) throw new Error('Failed to fetch contracts')

        const data = await response.json()
        setContracts(data.data || [])
      } catch (error) {
        console.error('Failed to load contracts:', error)
        setContracts([])
      } finally {
        setState((prev) => ({ ...prev, contractsLoading: false }))
      }
    }

    loadContracts()
  }, [formData.clientId])

  // Calculate subtotal
  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0
      return sum + price * item.quantity
    }, 0)
  }

  // Calculate total
  const calculateTotal = () => {
    const subtotal = parseFloat(formData.subtotal) || 0
    const tax = parseFloat(formData.taxAmount) || 0
    const discount = parseFloat(formData.discount) || 0
    return subtotal + tax - discount
  }

  // Handle contract selection
  const handleContractSelect = async (contractId: string) => {
    setFormData((prev) => ({
      ...prev,
      contractId: contractId || null,
      items: [{ description: '', quantity: 1, unitPrice: '' }],
    }))

    if (!contractId) {
      return
    }

    try {
      const response = await fetch(`/api/contracts/${contractId}`)
      if (!response.ok) throw new Error('Failed to fetch contract')
      const contract = await response.json()

      const lineItems = [
        {
          description: contract.title,
          quantity: 1,
          unitPrice: contract.value.toString(),
        },
      ]

      setFormData((prev) => ({
        ...prev,
        items: lineItems,
      }))
    } catch (error) {
      console.error('Failed to load contract details:', error)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientId) {
      setState((prev) => ({ ...prev, error: 'Client is required' }))
      return
    }

    if (formData.items.length === 0) {
      setState((prev) => ({ ...prev, error: 'At least one line item is required' }))
      return
    }

    // Validate line items
    for (const item of formData.items) {
      if (!item.description.trim()) {
        setState((prev) => ({ ...prev, error: 'All items must have a description' }))
        return
      }
      if (parseFloat(item.unitPrice) <= 0) {
        setState((prev) => ({ ...prev, error: 'All items must have a valid unit price' }))
        return
      }
    }

    try {
      setState((prev) => ({ ...prev, submitting: true, error: null }))

      const subtotal = calculateSubtotal()
      const taxAmount = parseFloat(formData.taxAmount) || 0
      const discount = parseFloat(formData.discount) || 0
      const totalAmount = subtotal + taxAmount - discount

      const updateData = {
        issueDate: new Date(formData.issueDate),
        dueDate: new Date(formData.dueDate),
        items: formData.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice) || 0,
        })),
        subtotal,
        taxAmount,
        discount,
        notes: formData.notes || null,
        contractId: formData.contractId || null,
      }

      await updateInvoice(invoiceId, updateData)
      router.push(`/invoices/${invoiceId}`)
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update invoice',
        submitting: false,
      }))
    }
  }

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-blue-400"></div>
          <p className="text-slate-400">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (!invoice || invoice.status !== 'DRAFT') {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 p-6 md:p-8">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Invoices
          </Link>
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg backdrop-blur">
            {state.error || 'Invoice not found or cannot be edited'}
          </div>
        </div>
      </div>
    )
  }

  const subtotal = calculateSubtotal()
  const tax = parseFloat(formData.taxAmount) || 0
  const discount = parseFloat(formData.discount) || 0
  const total = subtotal + tax - discount

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
            href={`/invoices/${invoiceId}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Invoice
          </Link>
          <h1 className="text-4xl font-bold text-white">Edit Invoice</h1>
          <p className="text-slate-400 mt-2">{invoice.invoiceNumber}</p>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg mb-8 backdrop-blur flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{state.error}</p>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Client & Contract */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Invoice Details</h2>

                <div className="space-y-4">
                  {/* Client */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Client <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.clientId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          clientId: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      required
                    >
                      <option value="">Select a client</option>
                      {state.clientsLoading ? (
                        <option disabled>Loading clients...</option>
                      ) : (
                        clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Contract */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Contract
                    </label>
                    <select
                      value={formData.contractId || ''}
                      onChange={(e) => handleContractSelect(e.target.value)}
                      disabled={!formData.clientId || state.contractsLoading}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!formData.clientId
                          ? 'Select a client first'
                          : state.contractsLoading
                            ? 'Loading contracts...'
                            : 'Select a contract (optional)'}
                      </option>
                      {contracts.map((contract) => (
                        <option key={contract.id} value={contract.id}>
                          {contract.contractNumber} - {contract.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Issue Date <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            issueDate: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Due Date <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            dueDate: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Line Items</h2>

                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...formData.items]
                          newItems[index].description = e.target.value
                          setFormData((prev) => ({ ...prev, items: newItems }))
                        }}
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...formData.items]
                          newItems[index].quantity = parseInt(e.target.value) || 1
                          setFormData((prev) => ({ ...prev, items: newItems }))
                        }}
                        className="w-20 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...formData.items]
                          newItems[index].unitPrice = e.target.value
                          setFormData((prev) => ({ ...prev, items: newItems }))
                        }}
                        className="w-28 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            items: prev.items.filter((_, i) => i !== index),
                          }))
                        }}
                        className="px-3 py-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg hover:bg-red-500/30 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        items: [...prev.items, { description: '', quantity: 1, unitPrice: '' }],
                      }))
                    }}
                    className="w-full px-4 py-3 bg-blue-500/20 border border-blue-500/50 text-blue-200 rounded-lg hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line Item
                  </button>
                </div>
              </div>

              {/* Additional Details */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Additional Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="Any additional notes or terms..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Summary */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-white mb-6">Summary</h3>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal:</span>
                    <span className="text-white font-semibold">${subtotal.toFixed(2)}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tax
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.taxAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          taxAmount: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Discount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discount: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/10 flex justify-between">
                    <span className="text-white font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-emerald-300">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={state.submitting}
                  className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {state.submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>

                <Link
                  href={`/invoices/${invoiceId}`}
                  className="w-full px-4 py-3 bg-slate-500/20 border border-slate-500/50 text-slate-200 rounded-lg hover:bg-slate-500/30 transition-all duration-200 font-medium text-center"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
