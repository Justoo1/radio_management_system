/**
 * Login Form Component
 * Handles user login with email and password
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { toast } from 'sonner'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check for error in URL params (NextAuth redirects with error)
    const error = searchParams.get('error')
    if (error === 'CredentialsSignin') {
      // Check if there's additional context in the error
      const errorMsg = searchParams.get('code')
      if (errorMsg === 'ORGANIZATION_SUSPENDED') {
        router.push('/suspended')
      } else if (errorMsg === 'ORGANIZATION_EXPIRED') {
        router.push('/expired')
      }
    }
  }, [searchParams, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setIsLoading(true)

    try {
      // First, check organization status via API
      const checkResponse = await fetch('/api/auth/check-org-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })

      if (checkResponse.ok) {
        const { status } = await checkResponse.json()
        if (status === 'SUSPENDED' || status === 'CANCELLED') {
          router.push('/suspended')
          return
        }
        if (status === 'EXPIRED') {
          router.push('/expired')
          return
        }
      }

      // Proceed with sign in
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        // Check if error contains organization status messages
        if (result.error.includes('SUSPENDED')) {
          router.push('/suspended')
          return
        }
        if (result.error.includes('EXPIRED')) {
          router.push('/expired')
          return
        }

        // Generic error message
        toast.error('Invalid email or password')
      } else if (result?.ok) {
        toast.success('Signed in successfully!')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          placeholder="you@example.com"
          className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          placeholder="Enter your password"
          className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
          disabled={isLoading}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300"
            disabled={isLoading}
          />
          <span className="ml-2 text-sm text-slate-600">Remember me</span>
        </label>
        <Link
          href="/forgot-password"
          className="text-sm text-slate-600 hover:text-slate-900 transition"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link href="/register" className="text-slate-900 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  )
}
