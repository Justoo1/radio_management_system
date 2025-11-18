/**
 * Subscription Expired Page
 * Shown when a user tries to access the app but their subscription has expired
 */

import Link from 'next/link'
import { Clock, CreditCard } from 'lucide-react'

export const metadata = {
  title: 'Subscription Expired',
  description: 'Your subscription has expired',
}

export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-3">Subscription Expired</h1>
            <p className="text-slate-300 mb-4">
              Your organization subscription has expired.
            </p>
            <p className="text-sm text-slate-400">
              To continue using our services, please renew your subscription.
            </p>
          </div>

          {/* Renew Notice */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Renew Your Subscription</h3>
                <p className="text-xs text-slate-400">
                  Contact our support team to renew your subscription and regain access to all features.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <a
              href="mailto:support@radiostation.com?subject=Subscription Renewal"
              className="block w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-center"
            >
              Contact Support to Renew
            </a>
            <Link
              href="/login"
              className="block w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors text-center"
            >
              Back to Login
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center">
              Need help? Email us at{' '}
              <a
                href="mailto:support@radiostation.com"
                className="text-indigo-400 hover:text-indigo-300"
              >
                support@radiostation.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
