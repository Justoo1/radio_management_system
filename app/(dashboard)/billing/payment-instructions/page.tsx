/**
 * Payment Instructions Page
 * Guide for MoMo and other payment methods
 */

'use client'

import { useSession } from 'next-auth/react'
import { Copy, Check, Phone, DollarSign, Clock, AlertCircle, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getSubscriptionStatus } from '@/app/actions/subscription'

interface SubscriptionStatus {
  organizationId: string
  organizationName: string
  status: string
  subscription: {
    planName: string
    planPrice: string
  } | null
}

export default function PaymentInstructionsPage() {
  const { data: session } = useSession()
  const [copied, setCopied] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        if (session?.user?.organizationId) {
          const status = await getSubscriptionStatus(session.user.organizationId)
          setSubscriptionStatus(status as any)
        }
      } catch (error) {
        console.error('Error fetching subscription status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [session?.user?.organizationId])

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const mobileMoneyAccounts = [
    {
      network: 'MTN Mobile Money',
      accountNumber: '+233 (0) 244 123 456',
      accountName: 'Radio Management Systems Ltd',
      code: '170',
    },
    {
      network: 'Vodafone Cash',
      accountNumber: '+233 (0) 207 456 789',
      accountName: 'Radio Management Systems Ltd',
      code: '110',
    },
    {
      network: 'AirtelTigo Money',
      accountNumber: '+233 (0) 266 789 123',
      accountName: 'Radio Management Systems Ltd',
      code: '106',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-400">Loading payment information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Organization & Plan Info */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {subscriptionStatus?.organizationName || 'Your Organization'}
        </h1>
        <p className="text-slate-400 mb-6">
          Complete your payment to activate your{' '}
          <span className="font-semibold text-indigo-300">
            {subscriptionStatus?.subscription?.planName || 'Professional'} Plan
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-2">Amount Due</p>
            <p className="text-2xl font-bold text-white">
              GHS {subscriptionStatus?.subscription?.planPrice || '500'}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-2">Billing Period</p>
            <p className="text-lg font-semibold text-white">Monthly</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-2">Reference Code</p>
            <p className="text-lg font-mono font-bold text-indigo-300 break-all">
              {subscriptionStatus?.organizationId?.substring(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Warning Alert */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-300 mb-1">Important</h3>
          <p className="text-sm text-amber-200">
            After making a payment, please contact our support team with your payment proof. We will verify and activate your account within 24 hours.
          </p>
        </div>
      </div>

      {/* Mobile Money Payment Methods */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Phone className="w-6 h-6 text-indigo-400" />
            Mobile Money Payment
          </h2>
          <p className="text-slate-400">
            Choose your preferred mobile money network and follow the steps below
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {mobileMoneyAccounts.map((account) => (
            <div
              key={account.network}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-indigo-500/30 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {account.network}
                  </h3>
                  <p className="text-sm text-slate-400">Account for {account.accountName}</p>
                </div>
                <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg text-sm font-mono">
                  Code: {account.code}
                </span>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                <p className="text-xs text-slate-400 mb-2">Account Number</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-lg font-bold text-white">
                    {account.accountNumber}
                  </p>
                  <button
                    onClick={() => handleCopyToClipboard(account.accountNumber)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white">Payment Steps:</h4>
                <ol className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex-shrink-0">
                      1
                    </span>
                    <span>Dial <span className="font-mono font-bold">*170#</span> (for MTN) or *110# (Vodafone) or *106# (AirtelTigo)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex-shrink-0">
                      2
                    </span>
                    <span>Select <span className="font-semibold">"Send Money"</span> from the menu</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex-shrink-0">
                      3
                    </span>
                    <span>Enter the account number: <span className="font-mono font-bold">{account.accountNumber}</span></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex-shrink-0">
                      4
                    </span>
                    <span>Enter amount: <span className="font-mono font-bold">GHS {subscriptionStatus?.subscription?.planPrice || '500'}</span></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex-shrink-0">
                      5
                    </span>
                    <span>Enter your PIN to confirm the transaction</span>
                  </li>
                </ol>
              </div>

              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-xs text-emerald-300">
                  <span className="font-semibold">Transaction ID:</span> You will receive an SMS confirmation with your transaction ID. Please keep this for reference.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bank Transfer Option */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-indigo-400" />
          Bank Transfer
        </h2>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-2">Bank Details</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-slate-400">Bank Name</span>
                <span className="font-semibold text-white">Zenith Bank Ghana Limited</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-slate-400">Account Name</span>
                <span className="font-semibold text-white">Radio Management Systems Ltd</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-slate-400">Account Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-white">1234567890</span>
                  <button
                    onClick={() => handleCopyToClipboard('1234567890')}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Routing Number</span>
                <span className="font-mono font-semibold text-white">050-000-001</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-300">
              <span className="font-semibold">Reference:</span> Please use your Reference Code ({subscriptionStatus?.organizationId?.substring(0, 8).toUpperCase()}) as the transaction reference for easy identification.
            </p>
          </div>
        </div>
      </div>

      {/* After Payment Steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-400" />
          After Payment
        </h2>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <ol className="space-y-3">
            <li className="flex gap-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex-shrink-0">
                1
              </span>
              <div>
                <p className="font-semibold text-white">Keep Your Receipt</p>
                <p className="text-sm text-slate-400">Take a screenshot or save the transaction proof/receipt</p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex-shrink-0">
                2
              </span>
              <div>
                <p className="font-semibold text-white">Contact Support</p>
                <p className="text-sm text-slate-400">
                  Email: <span className="font-mono text-indigo-300">support@radiomanagementsystem.com</span> or call <span className="font-mono text-indigo-300">+233 (0) 200 123 456</span>
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex-shrink-0">
                3
              </span>
              <div>
                <p className="font-semibold text-white">Submit Proof</p>
                <p className="text-sm text-slate-400">Provide your transaction ID and organization reference code along with the payment receipt</p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex-shrink-0">
                4
              </span>
              <div>
                <p className="font-semibold text-white">Wait for Verification</p>
                <p className="text-sm text-slate-400">Our team will verify your payment and activate your account within 24 business hours</p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex-shrink-0">
                5
              </span>
              <div>
                <p className="font-semibold text-white">Access Granted</p>
                <p className="text-sm text-slate-400">Once verified, you will receive a confirmation email and your account will be fully activated</p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Need Help?</h3>
        <p className="text-slate-300 mb-4">
          If you have any issues with payment or need assistance, our support team is here to help.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="mailto:support@radiomanagementsystem.com"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/30 hover:border-indigo-400/50 text-indigo-200 rounded-lg transition-all"
          >
            <span>📧 Email Support</span>
          </a>
          <a
            href="tel:+233200123456"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/40 hover:bg-purple-600/60 border border-purple-400/30 hover:border-purple-400/50 text-purple-200 rounded-lg transition-all"
          >
            <span>☎️ Call Support</span>
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>

        <div className="space-y-3">
          <details className="group bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-indigo-500/30 transition-all">
            <summary className="font-semibold text-white flex justify-between items-center">
              When will my account be activated after payment?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="text-slate-400 mt-3 text-sm">
              After we verify your payment, your account will be activated within 24 business hours. You will receive a confirmation email once your account is active.
            </p>
          </details>

          <details className="group bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-indigo-500/30 transition-all">
            <summary className="font-semibold text-white flex justify-between items-center">
              What payment methods do you accept?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="text-slate-400 mt-3 text-sm">
              We currently accept Mobile Money (MTN, Vodafone, AirtelTigo) and Bank Transfers. Credit card payments will be available soon.
            </p>
          </details>

          <details className="group bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-indigo-500/30 transition-all">
            <summary className="font-semibold text-white flex justify-between items-center">
              What is the grace period after my payment is due?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="text-slate-400 mt-3 text-sm">
              We provide a 7-day grace period after your due date. If payment is not received within this period, your account may be suspended temporarily.
            </p>
          </details>

          <details className="group bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-indigo-500/30 transition-all">
            <summary className="font-semibold text-white flex justify-between items-center">
              Can I get a receipt or invoice for my payment?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="text-slate-400 mt-3 text-sm">
              Yes! After your payment is verified and your account is activated, you will automatically receive an invoice in your account dashboard and via email.
            </p>
          </details>

          <details className="group bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-indigo-500/30 transition-all">
            <summary className="font-semibold text-white flex justify-between items-center">
              Do you offer discounts for annual billing?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="text-slate-400 mt-3 text-sm">
              Yes! We offer 15% discount for annual billing and 10% discount for quarterly billing. Contact our sales team for more details.
            </p>
          </details>
        </div>
      </div>
    </div>
  )
}
