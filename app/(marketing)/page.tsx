/**
 * Marketing - Landing Page
 * Public-facing landing page for the platform
 */

'use client'

import Link from 'next/link'
import { ArrowRight, Radio, BarChart3, MessageSquare, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="space-y-20 py-12">
      {/* Hero Section */}
      <section className="px-4 md:px-8 lg:px-16 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900">
            Radio Management Made Simple
          </h1>
          <p className="text-xl text-slate-600">
            Complete SaaS platform for radio stations to manage clients, programs, SMS campaigns, and advertising all in one place.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-lg hover:bg-slate-800 transition"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-slate-300 px-8 py-3 rounded-lg hover:bg-slate-50 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 md:px-8 lg:px-16 py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">
            Powerful Features for Your Station
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              <Radio className="w-12 h-12 text-slate-900 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-900">
                Program Management
              </h3>
              <p className="text-slate-600 text-sm">
                Create, schedule, and manage radio programs with ease
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              <MessageSquare className="w-12 h-12 text-slate-900 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-900">
                SMS Campaigns
              </h3>
              <p className="text-slate-600 text-sm">
                Send bulk SMS campaigns to your listeners and clients
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              <BarChart3 className="w-12 h-12 text-slate-900 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-900">
                Analytics & Reports
              </h3>
              <p className="text-slate-600 text-sm">
                Track performance with detailed analytics and reports
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              <Shield className="w-12 h-12 text-slate-900 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-900">
                Multi-Tenant Secure
              </h3>
              <p className="text-slate-600 text-sm">
                Enterprise-grade security with complete data isolation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 md:px-8 lg:px-16 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-slate-900">
            Simple Pricing
          </h2>
          <p className="text-xl text-slate-600 mb-16">
            Start free with a 7-day trial. No credit card required.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-slate-900 font-semibold hover:text-slate-600"
          >
            View Pricing Plans <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 lg:px-16 py-20 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl font-bold">
            Ready to Transform Your Radio Station?
          </h2>
          <p className="text-xl text-slate-300">
            Start your 7-day free trial today. No credit card required.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-3 rounded-lg hover:bg-slate-100 transition font-semibold"
          >
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
