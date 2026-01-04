/**
 * Feature Locked Component
 * Displays when a user tries to access a locked feature
 */

'use client'

import { Lock, Sparkles, Check, Phone } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface FeatureLockedProps {
  featureName: string
  featureDescription?: string
}

export function FeatureLocked({ featureName, featureDescription }: FeatureLockedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl w-full">
        {/* Lock Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-full">
              <Lock className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Feature Locked
            </h1>
            <h2 className="text-2xl font-semibold text-white mb-3">
              {featureName}
            </h2>
            {featureDescription && (
              <p className="text-slate-400 text-lg">
                {featureDescription}
              </p>
            )}
          </div>

          <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
            <div className="flex items-start gap-3 text-slate-300">
              <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <p>
                This feature is not included in your current plan. Upgrade to unlock{' '}
                <span className="font-semibold text-white">{featureName}</span> and other
                premium features to grow your business.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/upgrade" className="flex-1">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/30"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                View Upgrade Plans
              </Button>
            </Link>
            <Link href="/settings/billing" className="flex-1">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white/20 bg-white/10 font-semibold"
              >
                Manage Subscription
              </Button>
            </Link>
          </div>
        </div>

        {/* Benefits Preview */}
        <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            What You'll Get When You Upgrade
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Unlimited SMS Campaigns',
              'Advanced Analytics & Reports',
              'Media Library Access',
              'WhatsApp Integration',
              'Ad Campaign Management',
              'Priority Support',
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-slate-300">
                <div className="bg-green-500/20 rounded-full p-1">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm mb-2">
            Need help choosing the right plan?
          </p>
          <a
            href="tel:+233123456789"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium"
          >
            <Phone className="w-4 h-4" />
            Contact us for assistance
          </a>
        </div>
      </div>
    </div>
  )
}
