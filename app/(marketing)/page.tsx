/**
 * Marketing - Landing Page
 * Public-facing landing page for the platform
 */

'use client'

import Link from 'next/link'
import { ArrowRight, Radio, BarChart3, MessageSquare, Shield, Sparkles, Zap, Users, CheckCircle, TrendingUp, Headphones } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Hero Section */}
      <section className="relative px-4 md:px-8 lg:px-16 py-24 md:py-32 text-center overflow-hidden bg-gradient-to-br from-purple-100 via-indigo-50 to-pink-100">
        {/* Animated Radio Waves Background - Hero Only */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Vibrant Gradient Base */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-200/60 via-indigo-100/40 to-pink-200/60"></div>

          {/* Radio Wave Rings - Centered */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border-4 border-purple-500/40 rounded-full animate-wave"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border-4 border-purple-400/35 rounded-full animate-wave animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border-4 border-indigo-500/40 rounded-full animate-wave animation-delay-2000"></div>

          {/* Secondary Wave Rings - Top Right */}
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] border-4 border-indigo-500/35 rounded-full animate-wave animation-delay-500"></div>
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] border-4 border-purple-500/30 rounded-full animate-wave animation-delay-1500"></div>

          {/* Tertiary Wave Rings - Bottom Left */}
          <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] border-4 border-pink-500/35 rounded-full animate-wave animation-delay-2500"></div>
          <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] border-4 border-violet-500/30 rounded-full animate-wave animation-delay-1000"></div>

          {/* Gradient Orbs - More Vibrant */}
          <div className="absolute top-10 left-10 w-[600px] h-[600px] bg-purple-400/35 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-10 right-10 w-[600px] h-[600px] bg-indigo-400/35 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-pink-400/35 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
          <div className="absolute top-1/2 right-1/3 w-[500px] h-[500px] bg-violet-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-1000"></div>

          {/* Floating Particles - More Visible */}
          <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-purple-500 rounded-full animate-float opacity-60"></div>
          <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-indigo-500 rounded-full animate-float animation-delay-1000 opacity-60"></div>
          <div className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-pink-500 rounded-full animate-float animation-delay-2000 opacity-60"></div>
          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-violet-500 rounded-full animate-float animation-delay-500 opacity-50"></div>
          <div className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-purple-500 rounded-full animate-float animation-delay-2500 opacity-50"></div>
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-indigo-500 rounded-full animate-float animation-delay-1500 opacity-50"></div>
        </div>
        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-purple-300 rounded-full text-sm font-medium text-purple-700 mb-4 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>The Future of Radio Management</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-tight">
            Radio Management
            <br />
            Made Simple
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 max-w-3xl mx-auto leading-relaxed font-medium">
            Complete SaaS platform for radio stations to manage clients, programs, SMS campaigns, and advertising all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-semibold text-lg"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-purple-200 bg-white px-8 py-4 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 font-semibold text-lg text-slate-700"
            >
              Sign In
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-12 text-sm text-slate-900">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span>Bank-level Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Trusted by 1000+ Stations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-4 md:px-8 lg:px-16 py-20 bg-gradient-to-br from-slate-50 to-purple-50/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Powerful Features for Your Station
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need to run a modern radio station, all in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm border border-purple-100 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Radio className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900">
                Program Management
              </h3>
              <p className="text-slate-600">
                Create, schedule, and manage radio programs with ease
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm border border-purple-100 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900">
                SMS Campaigns
              </h3>
              <p className="text-slate-600">
                Send bulk SMS campaigns to your listeners and clients
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm border border-purple-100 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900">
                Analytics & Reports
              </h3>
              <p className="text-slate-600">
                Track performance with detailed analytics and reports
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm border border-purple-100 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900">
                Multi-Tenant Secure
              </h3>
              <p className="text-slate-600">
                Enterprise-grade security with complete data isolation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 md:px-8 lg:px-16 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Why Radio Stations Choose Us
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Easy to Use</h3>
                    <p className="text-slate-600">Intuitive interface that your team will love</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Comprehensive Features</h3>
                    <p className="text-slate-600">Everything you need in one platform</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">24/7 Support</h3>
                    <p className="text-slate-600">We're here whenever you need us</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Scalable & Reliable</h3>
                    <p className="text-slate-600">Grows with your station's needs</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-3xl flex items-center justify-center border border-purple-200">
                <Headphones className="w-32 h-32 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 md:px-8 lg:px-16 py-20 bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Start free with a 30-day trial. No credit card required.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-purple-700 bg-purple-100 px-4 py-2 rounded-full mb-8">
            <TrendingUp className="w-4 h-4" />
            <span>All features included in every plan</span>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 text-lg group"
          >
            View Pricing Plans
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 lg:px-16 py-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white text-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:50px_50px]"></div>
        </div>

        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Transform Your Radio Station?
          </h2>
          <p className="text-xl text-purple-100">
            Join thousands of radio stations already using RadioMgmt to streamline their operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-xl hover:bg-purple-50 transition-all duration-300 font-semibold text-lg shadow-xl"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold text-lg"
            >
              View Pricing
            </Link>
          </div>
          <p className="text-sm text-purple-200 pt-4">
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  )
}
