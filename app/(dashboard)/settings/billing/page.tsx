/**
 * Billing Settings Page
 * Manage subscription, payment methods, and invoices
 */

'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Download, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { FormInput } from '@/components/settings/form-input'
import { FormSection } from '@/components/settings/form-section'
import { SettingsCard } from '@/components/settings/settings-card'
import {
  getSubscriptionInfo,
  getInvoices,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  updateBillingAddress,
} from '@/app/actions/billing'

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  totalAmount: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
}

interface SubscriptionData {
  id: string
  plan: {
    name: string
    price: number
    currency: string
    billingInterval: string
  }
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
}

interface FormErrors {
  [key: string]: string
}

export default function BillingSettingsPage() {
  // Subscription State
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  // Invoices State
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      brand: 'Visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
    {
      id: '2',
      brand: 'Mastercard',
      last4: '5555',
      expiryMonth: 6,
      expiryYear: 2026,
      isDefault: false,
    },
  ])
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [paymentSaving, setPaymentSaving] = useState(false)

  // New Card State
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvc: '',
  })
  const [cardErrors, setCardErrors] = useState<FormErrors>({})

  // Billing Address State
  const [billingAddress, setBillingAddress] = useState({
    fullName: 'John Doe',
    email: 'john@lightfm.com',
    address: '123 Main Street',
    city: 'Accra',
    country: 'Ghana',
    zipCode: '',
  })
  const [addressErrors, setAddressErrors] = useState<FormErrors>({})
  const [addressSaving, setAddressSaving] = useState(false)

  // Messages
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load data on mount
  useEffect(() => {
    loadSubscriptionData()
    loadInvoices()
  }, [])

  const loadSubscriptionData = async () => {
    try {
      setSubscriptionLoading(true)
      const response = await getSubscriptionInfo()

      if (response.success && response.data) {
        setSubscription(response.data as any)
      } else {
        setMessage({
          type: 'error',
          text: response.error || response.message,
        })
      }
    } catch (error) {
      console.error('Failed to load subscription:', error)
      setMessage({
        type: 'error',
        text: 'Failed to load subscription information',
      })
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const loadInvoices = async () => {
    try {
      setInvoicesLoading(true)
      const response = await getInvoices({ page: 1, pageSize: 10 })

      if (response.success && response.data?.invoices) {
        setInvoices(
          response.data.invoices.map((inv: any) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            issueDate: new Date(inv.issueDate).toLocaleDateString(),
            dueDate: new Date(inv.dueDate).toLocaleDateString(),
            totalAmount: inv.totalAmount,
            status: inv.status,
          }))
        )
      }
    } catch (error) {
      console.error('Failed to load invoices:', error)
    } finally {
      setInvoicesLoading(false)
    }
  }

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewCard((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (cardErrors[name]) {
      setCardErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentSaving(true)

    try {
      const result = await addPaymentMethod({
        cardNumber: newCard.cardNumber,
        cardName: newCard.cardName,
        expiryDate: newCard.expiryDate,
        cvc: newCard.cvc,
      })

      if (result.success && result.data) {
        setPaymentMethods((prev) => [...prev, result.data as PaymentMethod])
        setNewCard({
          cardNumber: '',
          cardName: '',
          expiryDate: '',
          cvc: '',
        })
        setShowAddPayment(false)
        setMessage({
          type: 'success',
          text: 'Payment method added successfully',
        })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({
          type: 'error',
          text: result.error || result.message,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setPaymentSaving(false)
    }
  }

  const handleDeletePayment = async (id: string) => {
    try {
      const result = await deletePaymentMethod(id)

      if (result.success) {
        setPaymentMethods((prev) => prev.filter((method) => method.id !== id))
        setMessage({
          type: 'success',
          text: 'Payment method deleted successfully',
        })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      console.error('Failed to delete payment method:', error)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const result = await setDefaultPaymentMethod(id)

      if (result.success) {
        setPaymentMethods((prev) =>
          prev.map((method) => ({
            ...method,
            isDefault: method.id === id,
          }))
        )
        setMessage({
          type: 'success',
          text: 'Default payment method updated',
        })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      console.error('Failed to set default payment method:', error)
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBillingAddress((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (addressErrors[name]) {
      setAddressErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddressSaving(true)

    try {
      const result = await updateBillingAddress({
        fullName: billingAddress.fullName,
        email: billingAddress.email,
        address: billingAddress.address,
        city: billingAddress.city,
        country: billingAddress.country,
        zipCode: billingAddress.zipCode,
        phone: '',
      })

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Billing address updated successfully',
        })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({
          type: 'error',
          text: result.error || result.message,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setAddressSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-500/20 text-emerald-300'
      case 'PENDING':
      case 'SENT':
        return 'bg-blue-500/20 text-blue-300'
      case 'OVERDUE':
        return 'bg-red-500/20 text-red-300'
      case 'DRAFT':
        return 'bg-slate-500/20 text-slate-300'
      default:
        return 'bg-slate-500/20 text-slate-300'
    }
  }

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading billing information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Message Display */}
      {message && (
        <div
          className={`p-4 border rounded-xl text-sm flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-red-500/20 border-red-500/50 text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message.text}
        </div>
      )}

      {/* Subscription Info */}
      {subscription && (
        <SettingsCard>
          <FormSection title="Current Subscription">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Plan</p>
                <p className="text-lg font-semibold text-white">{subscription.plan.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Price</p>
                <p className="text-lg font-semibold text-white">
                  {subscription.plan.currency} {subscription.plan.price.toFixed(2)}/{subscription.plan.billingInterval.toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <p className="text-lg font-semibold text-emerald-400">{subscription.status}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Renewal Date</p>
                <p className="text-lg font-semibold text-white">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
              <button className="px-4 py-2 bg-gradient-to-r from-indigo-600/40 to-purple-600/40 hover:from-indigo-600/60 hover:to-purple-600/60 border border-indigo-500/30 text-indigo-200 rounded-lg font-semibold transition-all duration-300">
                Change Plan
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-red-600/40 to-pink-600/40 hover:from-red-600/60 hover:to-pink-600/60 border border-red-500/30 text-red-200 rounded-lg font-semibold transition-all duration-300">
                Cancel Subscription
              </button>
            </div>
          </FormSection>
        </SettingsCard>
      )}

      {/* Payment Methods */}
      <SettingsCard>
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
          <div>
            <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
            <p className="text-sm text-slate-400 mt-1">Manage your payment methods</p>
          </div>
          <button
            onClick={() => setShowAddPayment(!showAddPayment)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>

        {showAddPayment && (
          <form onSubmit={handleAddPayment} className="mb-6 p-6 bg-white/5 rounded-xl border border-white/10 space-y-4">
            <FormInput
              id="cardName"
              name="cardName"
              type="text"
              label="Cardholder Name"
              value={newCard.cardName}
              onChange={handleCardChange}
              placeholder="John Doe"
              error={cardErrors.cardName}
            />

            <FormInput
              id="cardNumber"
              name="cardNumber"
              type="text"
              label="Card Number"
              value={newCard.cardNumber}
              onChange={handleCardChange}
              placeholder="4242 4242 4242 4242"
              error={cardErrors.cardNumber}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="expiryDate"
                name="expiryDate"
                type="text"
                label="Expiry Date"
                value={newCard.expiryDate}
                onChange={handleCardChange}
                placeholder="MM/YY"
                error={cardErrors.expiryDate}
              />
              <FormInput
                id="cvc"
                name="cvc"
                type="text"
                label="CVC"
                value={newCard.cvc}
                onChange={handleCardChange}
                placeholder="123"
                error={cardErrors.cvc}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
              >
                Add Card
              </button>
              <button
                type="button"
                onClick={() => setShowAddPayment(false)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:border-white/20 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <CreditCard className="w-6 h-6 text-indigo-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">
                      {method.brand} ending in {method.last4}
                    </p>
                    {method.isDefault && (
                      <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs rounded font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Expires {method.expiryMonth}/{method.expiryYear}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                    title="Set as default"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => handleDeletePayment(method.id)}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Invoices */}
      <SettingsCard>
        <FormSection title="Invoices" description="Download your past invoices">
          {invoicesLoading ? (
            <div className="py-8 text-center">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-8 text-center text-slate-400">No invoices found</div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-white">{invoice.invoiceNumber}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                      <span>{invoice.issueDate}</span>
                      <span>•</span>
                      <span>${invoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                    <button className="p-2 text-slate-400 hover:text-indigo-400 transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </FormSection>
      </SettingsCard>

      {/* Billing Address */}
      <SettingsCard>
        <FormSection title="Billing Address">
          <form onSubmit={handleAddressSubmit} className="space-y-6">
            <FormInput
              id="fullName"
              name="fullName"
              type="text"
              label="Full Name"
              value={billingAddress.fullName}
              onChange={handleAddressChange}
              error={addressErrors.fullName}
            />

            <FormInput
              id="email"
              name="email"
              type="email"
              label="Email Address"
              value={billingAddress.email}
              onChange={handleAddressChange}
              error={addressErrors.email}
            />

            <FormInput
              id="address"
              name="address"
              type="text"
              label="Street Address"
              value={billingAddress.address}
              onChange={handleAddressChange}
              error={addressErrors.address}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput
                id="city"
                name="city"
                type="text"
                label="City"
                value={billingAddress.city}
                onChange={handleAddressChange}
                error={addressErrors.city}
              />
              <FormInput
                id="zipCode"
                name="zipCode"
                type="text"
                label="Zip Code"
                value={billingAddress.zipCode}
                onChange={handleAddressChange}
                error={addressErrors.zipCode}
              />
              <FormInput
                id="country"
                name="country"
                type="text"
                label="Country"
                value={billingAddress.country}
                onChange={handleAddressChange}
                error={addressErrors.country}
              />
            </div>

            <button
              type="submit"
              disabled={addressSaving}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
            >
              {addressSaving ? 'Updating...' : 'Update Address'}
            </button>
          </form>
        </FormSection>
      </SettingsCard>
    </div>
  )
}
