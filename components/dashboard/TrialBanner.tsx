/**
 * Trial Countdown Banner
 * Shows remaining trial days and prompts user to subscribe
 */

'use client'

import Link from 'next/link'
import { Clock, Zap, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface TrialBannerProps {
  trialEndDate: string | Date
  organizationStatus: string
  dismissible?: boolean
}

export default function TrialBanner({
  trialEndDate,
  organizationStatus,
  dismissible = false
}: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState(0)

  useEffect(() => {
    // Calculate days remaining
    const endDate = new Date(trialEndDate)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    setDaysRemaining(diffDays > 0 ? diffDays : 0)

    // Check if banner was dismissed
    if (dismissible) {
      const dismissedUntil = sessionStorage.getItem('trial-banner-dismissed')
      if (dismissedUntil) {
        const dismissTime = parseInt(dismissedUntil)
        if (Date.now() < dismissTime) {
          setDismissed(true)
        }
      }
    }
  }, [trialEndDate, dismissible])

  const handleDismiss = () => {
    // Dismiss for 24 hours
    const dismissUntil = Date.now() + (24 * 60 * 60 * 1000)
    sessionStorage.setItem('trial-banner-dismissed', dismissUntil.toString())
    setDismissed(true)
  }

  // Don't show if not in trial or dismissed
  if (organizationStatus !== 'TRIAL' || dismissed) {
    return null
  }

  // Determine urgency level
  let urgencyColor = 'blue' // Default: more than 3 days
  let urgencyMessage = 'Your trial is active'

  if (daysRemaining === 0) {
    urgencyColor = 'red'
    urgencyMessage = 'Your trial expires today!'
  } else if (daysRemaining === 1) {
    urgencyColor = 'red'
    urgencyMessage = 'Your trial expires tomorrow!'
  } else if (daysRemaining <= 2) {
    urgencyColor = 'orange'
    urgencyMessage = 'Your trial is ending soon'
  } else if (daysRemaining <= 5) {
    urgencyColor = 'amber'
    urgencyMessage = 'Your trial is active'
  }

  const colorClasses = {
    blue: {
      bg: 'from-blue-500/10 to-cyan-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: 'text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    amber: {
      bg: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: 'text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700',
    },
    orange: {
      bg: 'from-orange-500/10 to-red-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      icon: 'text-orange-400',
      button: 'bg-orange-600 hover:bg-orange-700',
    },
    red: {
      bg: 'from-red-500/10 to-pink-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: 'text-red-400',
      button: 'bg-red-600 hover:bg-red-700',
    },
  }

  const colors = colorClasses[urgencyColor as keyof typeof colorClasses]

  return (
    <div className={`bg-gradient-to-r ${colors.bg} border-l-4 ${colors.border} rounded-lg p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors.bg} border ${colors.border} flex items-center justify-center`}>
            <Clock className={`w-5 h-5 ${colors.icon}`} />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className={`text-sm font-semibold ${colors.text} mb-1`}>
                {urgencyMessage}
              </h3>
              <p className="text-sm text-slate-300 mb-3">
                {daysRemaining === 0 ? (
                  <>Your trial period ends today. Subscribe now to continue enjoying all features without interruption.</>
                ) : daysRemaining === 1 ? (
                  <>You have <span className={`font-bold ${colors.text}`}>1 day</span> left in your trial. Subscribe now to keep full access.</>
                ) : (
                  <>You have <span className={`font-bold ${colors.text}`}>{daysRemaining} days</span> left in your trial period. Subscribe to continue with full access after your trial ends.</>
                )}
              </p>
              <Link
                href="/upgrade"
                className={`inline-flex items-center gap-2 ${colors.button} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg`}
              >
                <Zap className="w-4 h-4" />
                View Subscription Plans
              </Link>
            </div>
            {dismissible && daysRemaining > 2 && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
