/**
 * Payment Account Settings Page
 * Setup Paystack subaccount for receiving airtime payments
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  Trash2,
  Save
} from 'lucide-react'

interface Bank {
  name: string
  code: string
}

interface PaymentAccount {
  paystackSubaccountId: string | null
  paystackSubaccountCode: string | null
  settlementType: string | null
  bankName: string | null
  accountNumber: string | null
  accountName: string | null
  bankCode: string | null
  momoProvider: string | null
  momoNumber: string | null
  momoName: string | null
  hasPaymentAccount: boolean
}

export default function PaymentAccountPage() {
  const [activeTab, setActiveTab] = useState<'bank' | 'mobile_money'>('bank')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [banks, setBanks] = useState<Bank[]>([])
  const [account, setAccount] = useState<PaymentAccount | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Bank account form
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [resolvingAccount, setResolvingAccount] = useState(false)

  // Mobile money form
  const [momoProvider, setMomoProvider] = useState('')
  const [momoNumber, setMomoNumber] = useState('')
  const [momoName, setMomoName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load current account setup
      const accountRes = await fetch('/api/settings/payment-account')
      if (accountRes.ok) {
        const accountData = await accountRes.json()
        setAccount(accountData.data)

        // Set form values if account exists
        if (accountData.data.hasPaymentAccount) {
          if (accountData.data.settlementType === 'bank') {
            setActiveTab('bank')
            setBankCode(accountData.data.bankCode || '')
            setAccountNumber(accountData.data.accountNumber || '')
            setAccountName(accountData.data.accountName || '')
          } else {
            setActiveTab('mobile_money')
            setMomoProvider(accountData.data.momoProvider || '')
            setMomoNumber(accountData.data.momoNumber || '')
            setMomoName(accountData.data.momoName || '')
          }
        }
      }

      // Load banks list
      const banksRes = await fetch('/api/settings/banks')
      if (banksRes.ok) {
        const banksData = await banksRes.json()
        setBanks(banksData.data)
      }
    } catch (err) {
      setError('Failed to load payment account settings')
    } finally {
      setLoading(false)
    }
  }

  const handleBankAccountSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/settings/payment-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settlementType: 'bank',
          accountNumber,
          accountName,
          bankCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup bank account')
      }

      setSuccess('Bank account setup successful! You can now receive airtime payments.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup bank account')
    } finally {
      setSaving(false)
    }
  }

  const handleMomoAccountSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/settings/payment-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settlementType: 'mobile_money',
          momoProvider,
          momoNumber,
          momoName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup mobile money account')
      }

      setSuccess('Mobile money account setup successful! You can now receive airtime payments.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup mobile money account')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to remove your payment account? This will disable airtime bookings.')) {
      return
    }

    setDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/settings/payment-account', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove payment account')
      }

      setSuccess('Payment account removed successfully')

      // Reset form
      setBankCode('')
      setAccountNumber('')
      setAccountName('')
      setMomoProvider('')
      setMomoNumber('')
      setMomoName('')

      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove payment account')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Account</h1>
        <p className="text-gray-600 mt-1">
          Setup your bank account or mobile money number to receive airtime booking payments
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Current Setup Status */}
      {account?.hasPaymentAccount && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Payment Account Active</h3>
                <p className="text-sm text-gray-600">
                  {account.settlementType === 'bank' ? 'Bank Account' : 'Mobile Money'}
                </p>
              </div>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Remove
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            {account.settlementType === 'bank' ? (
              <>
                <div>
                  <p className="text-sm text-gray-600">Bank Name</p>
                  <p className="font-medium text-gray-900">{account.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Number</p>
                  <p className="font-medium text-gray-900">{account.accountNumber}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Account Name</p>
                  <p className="font-medium text-gray-900">{account.accountName}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-gray-600">Provider</p>
                  <p className="font-medium text-gray-900">{account.momoProvider?.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mobile Number</p>
                  <p className="font-medium text-gray-900">{account.momoNumber}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Account Name</p>
                  <p className="font-medium text-gray-900">{account.momoName}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Setup Form */}
      {!account?.hasPaymentAccount && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('bank')}
                className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 ${
                  activeTab === 'bank'
                    ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Building2 className="w-5 h-5" />
                Bank Account
              </button>
              <button
                onClick={() => setActiveTab('mobile_money')}
                className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 ${
                  activeTab === 'mobile_money'
                    ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                Mobile Money
              </button>
            </div>
          </div>

          {/* Forms */}
          <div className="p-6">
            {activeTab === 'bank' ? (
              <form onSubmit={handleBankAccountSetup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank
                  </label>
                  <select
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select your bank</option>
                    {banks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="0123456789"
                    maxLength={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your account will be verified with Paystack
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Account holder name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Setup Bank Account
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleMomoAccountSetup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Money Provider
                  </label>
                  <select
                    value={momoProvider}
                    onChange={(e) => setMomoProvider(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select provider</option>
                    <option value="mtn">MTN Mobile Money</option>
                    <option value="vod">Vodafone Cash</option>
                    <option value="tgo">AirtelTigo Money</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    placeholder="0XXXXXXXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={momoName}
                    onChange={(e) => setMomoName(e.target.value)}
                    placeholder="Account holder name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Setup Mobile Money
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">About Airtime Payments</p>
            <ul className="space-y-1 text-blue-800">
              <li>• 100% of airtime booking payments go directly to your account</li>
              <li>• Payments are settled automatically by Paystack</li>
              <li>• You must setup a payment account to enable airtime bookings</li>
              <li>• Guests can pay via mobile money or card</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
