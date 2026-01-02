/**
 * Upgrade Plans Page
 * Shows available upgrade plans and payment instructions for existing customers
 */

'use client'

import { Check, X, Phone, Mail, MessageCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PricingPlan {
  name: string
  description: string
  price: string
  period: string
  features: { name: string; included: boolean }[]
  popular?: boolean
}

const plans: PricingPlan[] = [
  {
    name: 'Starter',
    description: 'Perfect for small radio stations getting started',
    price: 'GH₵ 500',
    period: 'per month',
    features: [
      { name: 'Client Management', included: true },
      { name: 'Program Scheduling', included: true },
      { name: 'Live On-Air Dashboard', included: true },
      { name: 'Invoices & Contracts', included: true },
      { name: 'Expense Tracking', included: true },
      { name: 'Basic Reports', included: true },
      { name: 'Up to 5 Users', included: true },
      { name: 'SMS Campaigns', included: false },
      { name: 'Advertisement Management', included: false },
      { name: 'Media Library', included: false },
      { name: 'WhatsApp Integration', included: false },
      { name: 'Advanced Analytics', included: false },
    ],
  },
  {
    name: 'Professional',
    description: 'For growing stations with advanced needs',
    price: 'GH₵ 1,200',
    period: 'per month',
    popular: true,
    features: [
      { name: 'Client Management', included: true },
      { name: 'Program Scheduling', included: true },
      { name: 'Live On-Air Dashboard', included: true },
      { name: 'Invoices & Contracts', included: true },
      { name: 'Basic Reports', included: true },
      { name: 'Up to 15 Users', included: true },
      { name: 'SMS Campaigns', included: true },
      { name: 'Advertisement Management', included: true },
      { name: 'Media Library', included: true },
      { name: 'WhatsApp Integration', included: true },
      { name: 'Expense Tracking', included: true },
      { name: 'Advanced Analytics', included: false },
    ],
  },
  {
    name: 'Enterprise',
    description: 'For large stations with custom requirements',
    price: 'Custom',
    period: 'Contact us',
    features: [
      { name: 'Everything in Professional', included: true },
      { name: 'Unlimited Users', included: true },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Custom Integrations', included: true },
      { name: 'Dedicated Account Manager', included: true },
      { name: 'Custom Training', included: true },
      { name: 'SLA Guarantee', included: true },
    ],
  },
]

export default function PricingPage() {
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
            Upgrade Your Plan
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Unlock premium features and grow your radio station with our flexible upgrade plans
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative group ${plan.popular ? 'md:scale-105 md:z-10' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Card Background Glow */}
              <div className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${plan.popular ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30' : 'bg-gradient-to-r from-blue-600/20 to-purple-600/20'}`} />

              {/* Card */}
              <div className={`relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border ${plan.popular ? 'border-purple-500/50 shadow-2xl shadow-purple-500/20' : 'border-white/20'} hover:border-purple-500/50 transition-all duration-300`}>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400 text-sm">{plan.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <div className="bg-green-500/20 rounded-full p-1 flex-shrink-0 mt-0.5">
                          <Check className="w-4 h-4 text-green-400" />
                        </div>
                      ) : (
                        <div className="bg-slate-500/20 rounded-full p-1 flex-shrink-0 mt-0.5">
                          <X className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <span className={`text-sm ${feature.included ? 'text-slate-300' : 'text-slate-500'}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <a href="tel:+233123456789">
                  <Button
                    size="lg"
                    className={`w-full ${plan.popular ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30' : 'bg-white/10 hover:bg-white/20 border border-white/20'} font-semibold`}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Call to Upgrade
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Instructions */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Phone className="w-6 h-6 text-purple-400" />
            How to Upgrade
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Contact Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Step 1: Contact Us</h3>
                <p className="text-slate-400 mb-4">
                  Get in touch with us to discuss your needs and choose the right plan for your station.
                </p>

                <div className="space-y-3">
                  <a
                    href="tel:+233123456789"
                    className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition group"
                  >
                    <div className="bg-green-500/20 p-2 rounded-lg group-hover:bg-green-500/30 transition">
                      <Phone className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Call us</p>
                      <p className="text-white font-medium">+233 123 456 789</p>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/233123456789"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition group"
                  >
                    <div className="bg-green-500/20 p-2 rounded-lg group-hover:bg-green-500/30 transition">
                      <MessageCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">WhatsApp</p>
                      <p className="text-white font-medium">+233 123 456 789</p>
                    </div>
                  </a>

                  <a
                    href="mailto:billing@radiomgmt.com"
                    className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition group"
                  >
                    <div className="bg-blue-500/20 p-2 rounded-lg group-hover:bg-blue-500/30 transition">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Email</p>
                      <p className="text-white font-medium">billing@radiomgmt.com</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column - Payment Process */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Step 2: Make Payment</h3>
                <p className="text-slate-400 mb-4">
                  After confirming your plan, make payment via Mobile Money to activate your features.
                </p>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h4 className="font-semibold text-white mb-3">Payment Methods</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-slate-300">
                      <div className="bg-purple-500/20 rounded p-1.5">
                        <Check className="w-4 h-4 text-purple-400" />
                      </div>
                      <span>MTN Mobile Money</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                      <div className="bg-purple-500/20 rounded p-1.5">
                        <Check className="w-4 h-4 text-purple-400" />
                      </div>
                      <span>Vodafone Cash</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                      <div className="bg-purple-500/20 rounded p-1.5">
                        <Check className="w-4 h-4 text-purple-400" />
                      </div>
                      <span>AirtelTigo Money</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                      <div className="bg-purple-500/20 rounded p-1.5">
                        <Check className="w-4 h-4 text-purple-400" />
                      </div>
                      <span>Bank Transfer</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Step 3: Activation</h3>
                <p className="text-slate-400">
                  Once payment is confirmed, we'll activate your premium features within 1 hour. You'll receive a confirmation email and SMS.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">Can I upgrade or downgrade later?</h4>
              <p className="text-slate-400 text-sm">
                Yes! You can change your plan at any time. Contact us and we'll adjust your subscription.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Is there a setup fee?</h4>
              <p className="text-slate-400 text-sm">
                No setup fees. You only pay the monthly subscription fee for your chosen plan.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">What happens if I cancel?</h4>
              <p className="text-slate-400 text-sm">
                You can cancel anytime. Your data will be retained for 30 days in case you want to reactivate.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Do you offer annual billing?</h4>
              <p className="text-slate-400 text-sm">
                Yes! Pay annually and get 2 months free. Contact us for annual billing options.
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
