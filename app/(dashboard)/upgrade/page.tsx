/**
 * Upgrade Plans Page
 * Automated subscription with Paystack payment
 */

'use client'

import { useEffect, useState } from 'react'
import { Check, X, Sparkles, Loader2, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: string
  currency: string
  billingInterval: string
  maxUsers: number
  maxClients: number
  maxSMSPerMonth: number
  maxStorageGB: number
  maxPrograms: number
  features: string[]
  isPopular: boolean
}

interface OrganizationStatus {
  status: string
  currentPlan?: string
  trialEndDate?: string
  hasActiveSubscription?: boolean
}

export default function UpgradePage() {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [orgStatus, setOrgStatus] = useState<OrganizationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // Fetch plans and organization status in parallel
      const [plansRes, statusRes] = await Promise.all([
        fetch('/api/subscription/plans'),
        fetch('/api/organization/status'),
      ])

      if (plansRes.ok) {
        const plansData = await plansRes.json()
        setPlans(plansData.data || [])
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setOrgStatus({
          status: statusData.data?.status || 'ACTIVE',
          trialEndDate: statusData.data?.trialEndDate,
          hasActiveSubscription: statusData.data?.hasActiveSubscription || false,
        })
      }
    } catch (err) {
      setError('Failed to load subscription plans')
      console.error('Error loading plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId: string, planName: string) => {
    setProcessingPayment(planId)
    setError(null)

    try {
      // Use upgrade endpoint if user has active subscription, otherwise use subscribe
      const endpoint = orgStatus?.hasActiveSubscription
        ? '/api/subscription/upgrade'
        : '/api/subscription/subscribe'

      // Initialize payment
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      // Redirect to Paystack payment page
      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url
      } else {
        throw new Error('No payment URL received')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initialization failed')
      setProcessingPayment(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading subscription plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
            {orgStatus?.status === 'TRIAL' ? 'Choose Your Plan' : 'Upgrade Your Plan'}
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            {orgStatus?.status === 'TRIAL'
              ? 'Your trial is ending soon. Subscribe to continue with full access.'
              : 'Unlock premium features and grow your radio station with our flexible plans'}
          </p>
          {orgStatus?.status === 'EXPIRED' && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4 max-w-2xl mx-auto">
              <p className="text-red-300 font-semibold">
                ⚠️ Your trial has expired. Subscribe now to regain access to your account.
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-500/20 border border-red-500/50 rounded-xl p-4 max-w-4xl mx-auto">
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
            const isProcessing = processingPayment === plan.id

            return (
              <div
                key={plan.id}
                className={`relative group ${plan.isPopular ? 'md:scale-105 md:z-10' : ''}`}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Card Background Glow */}
                <div
                  className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30'
                      : 'bg-gradient-to-r from-blue-600/20 to-purple-600/20'
                  }`}
                />

                {/* Card */}
                <div
                  className={`relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border ${
                    plan.isPopular
                      ? 'border-purple-500/50 shadow-2xl shadow-purple-500/20'
                      : 'border-white/20'
                  } hover:border-purple-500/50 transition-all duration-300`}
                >
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">
                        {plan.currency} {parseFloat(plan.price).toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-sm">per month</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <div className="bg-green-500/20 rounded-full p-1 flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-sm text-slate-300">Up to {plan.maxUsers} Users</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="bg-green-500/20 rounded-full p-1 flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-sm text-slate-300">Up to {plan.maxClients} Clients</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="bg-green-500/20 rounded-full p-1 flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-sm text-slate-300">{plan.maxSMSPerMonth.toLocaleString()} SMS/month</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="bg-green-500/20 rounded-full p-1 flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-sm text-slate-300">{plan.maxStorageGB}GB Storage</span>
                    </li>
                    {features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="bg-green-500/20 rounded-full p-1 flex-shrink-0 mt-0.5">
                          <Check className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-sm text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {plan.name === 'Enterprise' ? (
                    <a href={`mailto:${process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'sales@radio.edtmsys.com'}`}>
                      <Button
                        size="lg"
                        className="w-full bg-white/10 hover:bg-white/20 border border-white/20 font-semibold"
                      >
                        Contact Sales
                      </Button>
                    </a>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => handleSubscribe(plan.id, plan.name)}
                      disabled={isProcessing}
                      className={`w-full ${
                        plan.isPopular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30'
                          : 'bg-white/10 hover:bg-white/20 border border-white/20'
                      } font-semibold disabled:opacity-50`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Pay with Paystack
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Payment Info */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-400" />
            Secure Payment with Paystack
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Pay with Mobile Money</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  MTN Mobile Money
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Vodafone Cash
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  AirtelTigo Money
                </li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Pay with Card</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Visa & Mastercard
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Secure 3D Authentication
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  PCI DSS Compliant
                </li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Instant Activation</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Automatic activation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Email confirmation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  No setup fees
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">Is payment secure?</h4>
              <p className="text-slate-400 text-sm">
                Yes! All payments are processed securely through Paystack, a PCI-DSS compliant payment gateway.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">When does my subscription start?</h4>
              <p className="text-slate-400 text-sm">
                Your subscription activates immediately after successful payment. You'll receive instant access.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Can I change plans later?</h4>
              <p className="text-slate-400 text-sm">
                Yes! You can upgrade or downgrade your plan at any time from your dashboard.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">What if payment fails?</h4>
              <p className="text-slate-400 text-sm">
                You can retry payment anytime. Your trial period won't expire until you successfully subscribe.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
