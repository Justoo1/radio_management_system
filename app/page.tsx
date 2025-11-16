/**
 * Root Page
 * Redirects to appropriate page based on user authentication
 */

'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      // Redirect authenticated users to dashboard
      router.push('/dashboard')
    } else {
      // Redirect unauthenticated users to marketing page
      router.push('/(marketing)')
    }
  }, [session, status, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Radio Management System</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
