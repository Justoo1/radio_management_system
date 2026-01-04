/**
 * Pricing Page
 * Display pricing plans and tiers
 */

'use client'

import Link from 'next/link'
import { Check, Zap, Users, Building2, ArrowRight, Sparkles } from 'lucide-react'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header with Animated Gradient */}
      <section className="relative px-4 md:px-8 lg:px-16 pt-20 pb-32 text-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles size={16} />
            7-Day Free Trial Available
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto">
            Choose the perfect plan for your radio station. Start free, scale as you grow.
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="px-4 md:px-8 lg:px-16 -mt-20 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10 pt-6">
            {/* Starter Plan */}
            <div className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-600"></div>

              <div className="p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Zap className="text-slate-600" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Starter</h3>
                </div>

                <p className="text-slate-600 mb-6">Perfect for small radio stations</p>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-slate-900">500</span>
                    <span className="text-xl text-slate-600">GH₵</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">per month</p>
                </div>

                <Link
                  href="/register"
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-all duration-300 font-semibold group-hover:shadow-lg mb-8"
                >
                  Get Started
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-900 uppercase tracking-wider">What's included</p>
                  <ul className="space-y-3">
                    {[
                      'Client Management',
                      'Program Scheduling',
                      'Live On-Air Dashboard',
                      'Invoices & Contracts',
                      'Basic Reports',
                      'Up to 5 Users',
                      '100 Clients',
                      '50 Programs'
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-slate-700">
                        <Check className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Professional Plan - Most Popular */}
            <div className="group relative bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 rounded-2xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 overflow-hidden">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                  <Sparkles size={16} />
                  MOST POPULAR
                </div>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

              <div className="p-8 lg:p-10 relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Users className="text-white" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Professional</h3>
                </div>

                <p className="text-purple-100 mb-6">For growing radio stations</p>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-white">1,200</span>
                    <span className="text-xl text-purple-100">GH₵</span>
                  </div>
                  <p className="text-purple-200 text-sm mt-1">per month</p>
                </div>

                <Link
                  href="/register"
                  className="w-full inline-flex items-center justify-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl hover:bg-purple-50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl mb-8"
                >
                  Start 7-Day Trial
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-white uppercase tracking-wider">Everything in Starter, plus</p>
                  <ul className="space-y-3">
                    {[
                      'SMS Campaigns (5,000/month)',
                      'Advertisement Management',
                      'Media Library (50GB)',
                      'WhatsApp Integration',
                      'Expense Tracking',
                      'Advanced Reports',
                      'Up to 15 Users',
                      '500 Clients'
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-white">
                        <Check className="text-yellow-300 flex-shrink-0 mt-0.5" size={20} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-slate-900">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-600 via-slate-900 to-slate-600"></div>

              <div className="p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
                    <Building2 className="text-white" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Enterprise</h3>
                </div>

                <p className="text-slate-600 mb-6">For large radio networks</p>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Custom</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">tailored pricing</p>
                </div>

                <a
                  href={`tel:${process.env.NEXT_PUBLIC_ADMIN_PHONE || '+233XXXXXXXXX'}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 to-slate-700 text-white px-6 py-3 rounded-xl hover:from-slate-800 hover:to-slate-600 transition-all duration-300 font-semibold group-hover:shadow-lg mb-8"
                >
                  Contact Sales
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </a>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Everything in Professional, plus</p>
                  <ul className="space-y-3">
                    {[
                      'Unlimited Users & Clients',
                      'Unlimited SMS',
                      'Unlimited Storage',
                      'Custom Integrations',
                      'Dedicated Account Manager',
                      'SLA Guarantee',
                      'Priority Support',
                      'On-Premise Option'
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-slate-700">
                        <Check className="text-slate-900 flex-shrink-0 mt-0.5" size={20} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 md:px-8 lg:px-16 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Can I upgrade or downgrade my plan?",
                answer: "Yes! You can change your plan at any time. Upgrades take effect immediately, and you'll be charged the prorated difference. Downgrades will take effect at the start of your next billing cycle."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept MTN Mobile Money, Vodafone Cash, and AirtelTigo Money for Ghana-based customers. International customers can pay via credit card through Stripe."
              },
              {
                question: "Is there a contract or commitment?",
                answer: "No contracts required! All plans are billed monthly and you can cancel anytime. No hidden fees, no penalties, no questions asked."
              },
              {
                question: "What happens when my trial ends?",
                answer: "Your 7-day free trial gives you full access to your chosen plan. When it ends, you'll be prompted to add a payment method. If you don't, your account will be suspended until payment is received."
              },
              {
                question: "Can I get a refund if I'm not satisfied?",
                answer: "Yes! We offer a 30-day money-back guarantee. If you're not completely satisfied with RMS, contact us within 30 days of your first payment for a full refund."
              },
              {
                question: "Do you offer discounts for annual payments?",
                answer: "Yes! Pay annually and save 15% compared to monthly billing. Contact our sales team for annual pricing options."
              }
            ].map((faq, index) => (
              <details
                key={index}
                className="group bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-purple-300 transition-all duration-300"
              >
                <summary className="cursor-pointer font-semibold text-slate-900 flex items-center justify-between list-none">
                  <span className="text-lg">{faq.question}</span>
                  <span className="ml-4 flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-open:bg-purple-600 group-open:text-white transition-all duration-300">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <p className="mt-4 text-slate-600 leading-relaxed pl-0">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 lg:px-16 py-20 bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Radio Station?
          </h2>
          <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of radio stations across Ghana managing their operations with RMS. Start your free trial today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-xl hover:bg-purple-50 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-white/50"
            >
              Start Free Trial
              <ArrowRight size={20} />
            </Link>
            <a
              href={`tel:${process.env.NEXT_PUBLIC_ADMIN_PHONE || '+233XXXXXXXXX'}`}
              className="inline-flex items-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-300 font-bold text-lg"
            >
              Contact Sales
            </a>
          </div>
          <p className="text-purple-200 text-sm mt-6">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  )
}
