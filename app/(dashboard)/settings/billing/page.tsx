/**
 * Billing Settings Page
 * Manage subscription and view payment history
 */

'use client'

import { useState, useEffect } from 'react'
import { Phone, MessageCircle, Mail, CheckCircle, Clock, CreditCard, Download, FileText, Calendar, PartyPopper } from 'lucide-react'
import { FormSection } from '@/components/settings/form-section'
import { SettingsCard } from '@/components/settings/settings-card'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getEnabledFeatures } from '@/app/actions/features'
import { getOrganizationPayments } from '@/app/actions/subscription'
import { getOrganizationInfo } from '@/app/actions/organization'
import { FEATURES, Feature, getPremiumFeatures, FeatureDefinition } from '@/lib/features'
import * as LucideIcons from 'lucide-react'

interface Payment {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: string
  paymentMethod: string
  paymentDate: Date
  referenceNumber: string | null
  network: string | null
  mobileNumber: string | null
}

interface Subscription {
  planName: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  nextPaymentDate: Date | null
}

export default function BillingSettingsPage() {
  const searchParams = useSearchParams()
  const upgradeSuccess = searchParams.get('upgrade') === 'success'
  const subscriptionSuccess = searchParams.get('subscription') === 'success'
  const [showSuccess, setShowSuccess] = useState(upgradeSuccess || subscriptionSuccess)
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  // Load enabled features and payment history
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get enabled features
        const featuresResult = await getEnabledFeatures()
        setEnabledFeatures(featuresResult)

        // Get organization
        const orgResponse = await getOrganizationInfo()
        if (orgResponse.success && orgResponse.data?.id) {
          setOrganizationId(orgResponse.data.id)

          // Get payment history
          const paymentData = await getOrganizationPayments(orgResponse.data.id)
          setPayments(paymentData.payments)
          setSubscription(paymentData.subscription)
        }
      } catch (error) {
        console.error('Failed to load billing data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Determine current plan based on enabled features
  const getCurrentPlan = () => {
    const premiumFeatures = getPremiumFeatures()
    const enabledPremiumCount = premiumFeatures.filter((f) =>
      enabledFeatures.includes(f.key)
    ).length

    if (enabledPremiumCount === 0) {
      return {
        name: 'Starter Plan',
        price: 'GH₵ 500',
        status: 'ACTIVE',
        features: enabledFeatures,
      }
    } else if (enabledPremiumCount >= premiumFeatures.length) {
      return {
        name: 'Professional Plan',
        price: 'GH₵ 1,200',
        status: 'ACTIVE',
        features: enabledFeatures,
      }
    } else {
      return {
        name: 'Custom Plan',
        price: 'GH₵ 500 - 1,200',
        status: 'ACTIVE',
        features: enabledFeatures,
      }
    }
  }

  const currentPlan = getCurrentPlan()

  // Download receipt
  const handleDownloadInvoice = async (paymentId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/subscription/receipts/${paymentId}`)
      if (!response.ok) throw new Error('Failed to download receipt')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading receipt:', error)
      alert('Failed to download receipt. Please try again.')
    }
  }

  // Format payment status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Paid
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded-full text-xs font-semibold">
            {status}
          </span>
        )
    }
  }

  // Format payment method
  const formatPaymentMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      MOBILE_MONEY: 'Mobile Money',
      BANK_TRANSFER: 'Bank Transfer',
      CARD: 'Card Payment',
      CASH: 'Cash',
    }
    return methodMap[method] || method
  }

  // Contact information
  const contactInfo = {
    phone: process.env.NEXT_PUBLIC_ADMIN_PHONE || '+233 XX XXX XXXX',
    whatsapp: process.env.NEXT_PUBLIC_ADMIN_PHONE || '+233 XX XXX XXXX',
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'billing@radio.edtymsys.com',
  }

  if (loading) {
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
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-6 relative">
          <button
            onClick={() => setShowSuccess(false)}
            className="absolute top-4 right-4 text-emerald-300 hover:text-emerald-100"
          >
            ✕
          </button>
          <div className="flex items-start gap-4">
            <div className="bg-emerald-500/30 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-emerald-100 mb-2">
                {upgradeSuccess ? 'Plan Upgrade Successful!' : 'Subscription Activated!'}
              </h3>
              <p className="text-emerald-200 mb-3">
                {upgradeSuccess
                  ? 'Your plan has been successfully upgraded. Your new limits and features are now active.'
                  : 'Your subscription has been activated successfully. Welcome aboard!'}
              </p>
              <p className="text-sm text-emerald-300">
                Payment will be processed shortly. You can view your receipt below once the payment is confirmed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <SettingsCard>
        <FormSection title="Current Subscription">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Plan</p>
              <p className="text-lg font-semibold text-white">{currentPlan.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Price</p>
              <p className="text-lg font-semibold text-white">
                {currentPlan.price}/month
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                <p className="text-lg font-semibold text-emerald-400">{currentPlan.status}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Billing Cycle</p>
              <p className="text-lg font-semibold text-white">Monthly</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <Link
              href="/upgrade"
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-indigo-500/30"
            >
              Upgrade Plan
            </Link>
          </div>
        </FormSection>
      </SettingsCard>

      {/* Active Features */}
      <SettingsCard>
        <FormSection
          title="Active Features"
          description="Features currently enabled for your organization"
        >
          <div className="space-y-3">
            {Object.values(FEATURES).map((feature: FeatureDefinition) => {
              const isPremium = feature.premium
              // Core features are always enabled, premium features check the enabledFeatures list
              const isEnabled = !isPremium || enabledFeatures.includes(feature.key)
              const IconComponent = (LucideIcons as any)[feature.icon] || LucideIcons.HelpCircle

              return (
                <div
                  key={feature.key}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                    isEnabled
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isEnabled ? 'bg-emerald-500/20' : 'bg-white/5'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${
                        isEnabled ? 'text-emerald-400' : 'text-slate-400'
                      }`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${
                        isEnabled ? 'text-white' : 'text-slate-400'
                      }`}>
                        {feature.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isPremium ? 'Premium Feature' : 'Core Feature'}
                      </p>
                    </div>
                  </div>
                  <div>
                    {isEnabled ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-300">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-500/20 border border-slate-500/30 rounded-full">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-400">Locked</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </FormSection>
      </SettingsCard>

      {/* Payment Instructions */}
      <SettingsCard>
        <FormSection
          title="Payment Method"
          description="How to pay for your subscription"
        >
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <CreditCard className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-300 mb-2">Mobile Money Payment</h4>
                <p className="text-sm text-slate-300">
                  We accept payments via Mobile Money (MTN, Vodafone, AirtelTigo). To upgrade or renew your subscription:
                </p>
              </div>
            </div>

            <ol className="space-y-3 text-sm text-slate-300 ml-9">
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-xs flex-shrink-0">1</span>
                <span>Contact our billing team via phone, WhatsApp, or email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-xs flex-shrink-0">2</span>
                <span>Discuss which features you need for your organization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-xs flex-shrink-0">3</span>
                <span>Make payment via Mobile Money to our provided number</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-xs flex-shrink-0">4</span>
                <span>Send payment confirmation (screenshot/reference)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-xs flex-shrink-0">5</span>
                <span>We'll activate your features immediately upon confirmation</span>
              </li>
            </ol>
          </div>
        </FormSection>
      </SettingsCard>

      {/* Contact Information */}
      <SettingsCard>
        <FormSection
          title="Billing Support"
          description="Get in touch with our billing team"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Phone */}
            <a
              href={`tel:${contactInfo.phone}`}
              className="p-6 bg-white/5 border border-white/10 hover:border-indigo-500/30 rounded-xl transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                  <Phone className="w-5 h-5 text-indigo-400" />
                </div>
                <h4 className="font-semibold text-white">Phone</h4>
              </div>
              <p className="text-sm text-slate-300">{contactInfo.phone}</p>
              <p className="text-xs text-slate-500 mt-2">Call us during business hours</p>
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 bg-white/5 border border-white/10 hover:border-emerald-500/30 rounded-xl transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="font-semibold text-white">WhatsApp</h4>
              </div>
              <p className="text-sm text-slate-300">{contactInfo.whatsapp}</p>
              <p className="text-xs text-slate-500 mt-2">Chat with us anytime</p>
            </a>

            {/* Email */}
            <a
              href={`mailto:${contactInfo.email}`}
              className="p-6 bg-white/5 border border-white/10 hover:border-purple-500/30 rounded-xl transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                  <Mail className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="font-semibold text-white">Email</h4>
              </div>
              <p className="text-sm text-slate-300">{contactInfo.email}</p>
              <p className="text-xs text-slate-500 mt-2">Send us an inquiry</p>
            </a>
          </div>
        </FormSection>
      </SettingsCard>

      {/* Payment History & Invoices */}
      {subscription && (
        <SettingsCard>
          <FormSection
            title="Payment History & Invoices"
            description="View and download your payment receipts and invoices"
          >
            {/* Subscription Period */}
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-indigo-300 mb-2">Current Billing Period</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 mb-1">Period Start</p>
                      <p className="text-white font-semibold">
                        {new Date(subscription.currentPeriodStart).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Period End</p>
                      <p className="text-white font-semibold">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Next Payment</p>
                      <p className="text-white font-semibold">
                        {subscription.nextPaymentDate
                          ? new Date(subscription.nextPaymentDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Table */}
            {payments.length > 0 ? (
              <div className="border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white/5 border-b border-slate-700/50">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-indigo-400" />
                              <span className="font-mono text-sm text-white">{payment.invoiceNumber}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {new Date(payment.paymentDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-semibold text-white">
                              {payment.currency} {payment.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {formatPaymentMethod(payment.paymentMethod)}
                            {payment.network && (
                              <span className="text-xs text-slate-500 ml-1">({payment.network})</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleDownloadInvoice(payment.id, payment.invoiceNumber)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 border border-slate-700/50 rounded-xl">
                <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">No payment history yet</p>
                <p className="text-sm text-slate-500">
                  Your payment receipts and invoices will appear here
                </p>
              </div>
            )}
          </FormSection>
        </SettingsCard>
      )}

      {/* Pricing Plans */}
      <SettingsCard>
        <FormSection
          title="Available Plans"
          description="Choose the plan that fits your needs"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <h4 className="text-xl font-bold text-white mb-2">Starter</h4>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">GH₵ 500</span>
                <span className="text-slate-400 ml-2">/month</span>
              </div>
              <p className="text-sm text-slate-400 mb-4">Perfect for getting started</p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Client Management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Program Scheduling
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Live On-Air Dashboard
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Invoices & Contracts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Basic Reports
                </li>
              </ul>
            </div>

            {/* Professional Plan */}
            <div className="p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl relative">
              <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-xs font-semibold text-white">
                Popular
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Professional</h4>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">GH₵ 1,200</span>
                <span className="text-slate-400 ml-2">/month</span>
              </div>
              <p className="text-sm text-slate-400 mb-4">Everything in Starter, plus:</p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  SMS Campaigns
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Advertisement Management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Media Library
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Expense Tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Advanced Analytics
                </li>
              </ul>
            </div>

            {/* Enterprise Plan */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <h4 className="text-xl font-bold text-white mb-2">Enterprise</h4>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">Custom</span>
              </div>
              <p className="text-sm text-slate-400 mb-4">Tailored to your needs</p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Everything in Professional
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Priority Support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Custom Integrations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Dedicated Account Manager
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  SLA Guarantees
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/upgrade"
              className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-indigo-500/30"
            >
              View All Plans & Pricing
            </Link>
          </div>
        </FormSection>
      </SettingsCard>
    </div>
  )
}
