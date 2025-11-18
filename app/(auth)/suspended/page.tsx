/**
 * Account Suspended Page
 * Shown when a user tries to access the app but their organization is suspended
 */

import Link from 'next/link'
import { AlertCircle, Mail, PhoneCall, PhoneForwardedIcon, PhoneIcon } from 'lucide-react'

export const metadata = {
  title: 'Account Suspended',
  description: 'Your organization account has been suspended',
}

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-3">Account Suspended</h1>
            <p className="text-slate-300 mb-4">
              Your organization account has been suspended.
            </p>
            <p className="text-sm text-slate-400">
              This could be due to non-payment, terms violation, or other reasons. Please contact our support team for assistance.
            </p>
          </div>

          {/* Contact Support */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Contact Support</h3>
                <p className="text-xs text-slate-400 mb-2">
                  Get in touch with our team to resolve this issue
                </p>
                <div className="flex flex-col space-y-1">
                  <a
                  href="mailto:amankrahjay@gmail.com"
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  amankrahjay@gmail.com
                </a>
                <a
                  href="mailto:amankrahjay@gmail.com"
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <PhoneIcon className="w-4 h-4 inline-block mr-1" />+233 54 913 2837
                </a>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-center"
            >
              Back to Login
            </Link>
            <Link
              href="/"
              className="block w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors text-center"
            >
              Go to Homepage
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center">
              If you believe this is a mistake, please contact us immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
