/**
 * Subscription Plans API
 * Get all active subscription plans
 * OPTIMIZED: Added Redis caching (1 hour TTL - plans rarely change)
 */

import { NextResponse } from 'next/server'
import { getCachedSubscriptionPlans } from '@/lib/cache'

export async function GET() {
  try {
    // Use cached subscription plans (1 hour TTL)
    const plans = await getCachedSubscriptionPlans()

    return NextResponse.json({
      success: true,
      data: plans,
    })
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    )
  }
}

// Can be cached since plans rarely change
export const dynamic = 'force-dynamic'
