/**
 * Subscription Payment Callback Page
 * Handles redirect after Paystack payment and waits for webhook to process
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SubscriptionCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference')
  const trxref = searchParams.get('trxref')

  const paymentRef = reference || trxref

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'pending'>('verifying')
  const [message, setMessage] = useState('Verifying your payment...')
  const [attempts, setAttempts] = useState(0)
  const maxAttempts = 10

  const verifyPayment = useCallback(async () => {
    if (!paymentRef) {
      setStatus('failed')
      setMessage('No payment reference found')
      return
    }

    try {
      const response = await fetch(`/api/subscription/verify?reference=${paymentRef}`)
      const data = await response.json()

      if (data.success && data.data?.paymentStatus === 'COMPLETED') {
        setStatus('success')
        setMessage('Payment successful! Your subscription is now active.')
        // Wait a moment then redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard?upgrade=success')
        }, 2000)
      } else if (data.data?.paymentStatus === 'PENDING') {
        // Payment still pending, try again
        setStatus('pending')
        setMessage('Processing your payment...')
        setAttempts(prev => prev + 1)
      } else {
        setStatus('failed')
        setMessage(data.error || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('failed')
      setMessage('Failed to verify payment. Please contact support.')
    }
  }, [paymentRef, router])

  useEffect(() => {
    if (status === 'verifying' || (status === 'pending' && attempts < maxAttempts)) {
      const timer = setTimeout(verifyPayment, attempts === 0 ? 0 : 3000)
      return () => clearTimeout(timer)
    }
  }, [status, attempts, verifyPayment])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-md w-full text-center">
        {status === 'verifying' || status === 'pending' ? (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {status === 'verifying' ? 'Verifying Payment' : 'Processing Subscription'}
            </h1>
            <p className="text-slate-400 mb-4">{message}</p>
            {attempts > 0 && (
              <p className="text-sm text-slate-500">
                Attempt {attempts} of {maxAttempts}...
              </p>
            )}
          </>
        ) : status === 'success' ? (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-slate-400 mb-4">{message}</p>
            <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Payment Issue</h1>
            <p className="text-slate-400 mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  setStatus('verifying')
                  setAttempts(0)
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Link href="/upgrade">
                <Button variant="outline" className="w-full border-white/20 hover:bg-white/10">
                  Back to Upgrade
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full text-slate-400 hover:text-white">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
