/**
 * Create Invoice Page
 * Form to create a new invoice with line items
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Plus,
  Trash2,
  Loader,
} from 'lucide-react'
import { createInvoice, type InvoiceResponse } from '@/app/actions/financial'

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
}

interface Client {
  id: string
  name: string
}

interface Contract {
  id: string
  contractNumber: string
  title: string
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const [formState, setFormState] = useState<FormState>({
    loading: false,
    error: null,
    submitting: false,
    clientsLoading: true,
  })
  const [clients, setClients] = useState<Client[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [contractsLoading, setContractsLoading] = useState(false)

  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    contractId: null,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unitPrice: '' }],
    subtotal: '0',
    taxAmount: '0',
    discount: '0',
    notes: '',
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

  // Fetch contracts for selected client
  useEffect(() => {
    const fetchContracts = async () => {
      if (!formData.clientId) {
        setContracts([])
        return
      }

      try {
        setContractsLoading(true)
        const response = await fetch(`/api/contracts?clientId=${formData.clientId}`)
        if (!response.ok) throw new Error('Failed to fetch contracts')
        const data = await response.json()
        setContracts(data.data || [])
        // Reset contract selection when client changes
        setFormData((prev) => ({
          ...prev,
          contractId: null,
          items: [{ description: '', quantity: 1, unitPrice: '' }],
        }))
      } catch (error) {
        console.error('Failed to load contracts:', error)
      } finally {
        setContractsLoading(false)
      }
    }

    fetchContracts()
  }, [formData.clientId])

  // Calculate subtotal from items
  const calculateSubtotal = (items: InvoiceFormData['items']) => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0
      return sum + price * item.quantity
    }, 0)
  }

  // Update subtotal whenever items change
  useEffect(() => {
    const subtotal = calculateSubtotal(formData.items)
    setFormData((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
    }))
  }, [formData.items])

  // Calculate total
  const calculateTotal = () => {
    const subtotal = parseFloat(formData.subtotal) || 0
    const tax = parseFloat(formData.taxAmount) || 0
    const discount = parseFloat(formData.discount) || 0
    return Math.max(0, subtotal + tax - discount)
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }
    setFormData((prev) => ({
      ...prev,
      items: newItems,
    }))
  }

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { description: '', quantity: 1, unitPrice: '' },
      ],
    }))
  }

  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }))
    }
  }

  const handleContractSelect = async (contractId: string) => {
    setFormData((prev) => ({
      ...prev,
      contractId: contractId || null,
      items: [{ description: '', quantity: 1, unitPrice: '' }],
    }))

    if (!contractId) {
      return
    }

    // Fetch contract details to populate line items
    try {
      const response = await fetch(`/api/contracts/${contractId}`)
      if (!response.ok) throw new Error('Failed to fetch contract')
      const contract = await response.json()

      // Create line items from contract (description = title, price = value / quantity)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState((prev) => ({ ...prev, submitting: true, error: null }))

    try {
      // Validate required fields
      if (!formData.clientId) {
        throw new Error('Please select a client')
      }
      if (formData.items.length === 0) {
        throw new Error('Please add at least one item')
      }
      if (formData.items.some((item) => !item.description || !item.unitPrice)) {
        throw new Error('Please fill in all item details')
      }

      const response = await createInvoice({
        clientId: formData.clientId,
        contractId: formData.contractId,
        issueDate: new Date(formData.issueDate),
        dueDate: new Date(formData.dueDate),
        subtotal: parseFloat(formData.subtotal) || 0,
        taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : 0,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        notes: formData.notes,
        items: formData.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice) || 0,
        })),
      })

      // Redirect to invoice detail page
      router.push(`/invoices/${response.id}`)
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create invoice',
      }))
    } finally {
      setFormState((prev) => ({ ...prev, submitting: false }))
    }
  }

  const total = calculateTotal()

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
            href="/invoices"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Invoices
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Create Invoice
          </h1>
          <p className="text-slate-400 mt-2">Add invoice details and line items</p>
        </div>

        {/* Error Message */}
        {formState.error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg mb-8 backdrop-blur">
            {formState.error}
          </div>
        )}

        {/* Form Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Invoice Details Section */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Invoice Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

                  {/* Contract Selection (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Contract (Optional)
                    </label>
                    <select
                      value={formData.contractId || ''}
                      onChange={(e) => handleContractSelect(e.target.value)}
                      disabled={!formData.clientId || contractsLoading}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="" className="bg-slate-900">
                        {!formData.clientId
                          ? 'Select a client first'
                          : contractsLoading
                            ? 'Loading contracts...'
                            : 'No contract'}
                      </option>
                      {contracts.map((contract) => (
                        <option
                          key={contract.id}
                          value={contract.id}
                          className="bg-slate-900"
                        >
                          {contract.contractNumber} - {contract.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Issue Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Issue Date *
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
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                      required
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Due Date *
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
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Notes (Optional)
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
                    placeholder="Add any additional notes..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur resize-none"
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6">
                  <h2 className="text-lg font-semibold text-white">Line Items *</h2>
                  {formData.contractId && (
                    <p className="text-sm text-slate-400">
                      Items from contract below. Add more items as needed.
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      {/* Description */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(index, 'description', e.target.value)
                          }
                          placeholder="Item description"
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
                          required
                        />
                      </div>

                      {/* Quantity */}
                      <div className="w-20">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                          min="1"
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur text-center"
                          required
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="w-32">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(index, 'unitPrice', e.target.value)
                          }
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur text-right"
                          required
                        />
                      </div>

                      {/* Amount (Read-only) */}
                      <div className="w-32 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-emerald-300 font-semibold text-right flex items-center justify-end">
                        ${(item.quantity * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={formData.items.length === 1}
                        className="p-2.5 hover:bg-red-500/20 rounded-lg transition-all duration-200 text-red-300 hover:text-red-200 border border-transparent hover:border-red-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Item Button */}
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full mt-4 px-4 py-2.5 border border-dashed border-white/20 rounded-lg text-slate-300 hover:text-white hover:border-blue-500/50 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Add Line Item
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Summary Card */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Summary</h3>

                <div className="space-y-4">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Subtotal:</span>
                    <span className="text-white font-semibold">
                      ${parseFloat(formData.subtotal).toFixed(2)}
                    </span>
                  </div>

                  {/* Tax */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-slate-400">Tax:</label>
                      <input
                        type="number"
                        value={formData.taxAmount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            taxAmount: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-24 px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-right focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur text-sm"
                      />
                    </div>
                  </div>

                  {/* Discount */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-slate-400">Discount:</label>
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            discount: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-24 px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-right focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur text-sm"
                      />
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-emerald-300">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={formState.submitting}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/50 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState.submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Invoice'
                  )}
                </button>

                <Link
                  href="/invoices"
                  className="w-full px-6 py-3 bg-white/5 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-all duration-200 font-medium text-center"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
