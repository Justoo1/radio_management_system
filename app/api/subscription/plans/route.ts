/**
 * Subscription Plans API
 * Get all active subscription plans
 * OPTIMIZED: Added Redis caching with fallback to direct database query
 */

import { NextResponse } from 'next/server'
import { getCachedSubscriptionPlans } from '@/lib/cache'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Try cached subscription plans first (1 hour TTL)
    let plans = await getCachedSubscriptionPlans()

    // Fallback to direct database query if cache returns empty or fails
    if (!plans || plans.length === 0) {
      console.log('Cache miss or empty - fetching plans directly from database')
      plans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      })
    }

    return NextResponse.json({
      success: true,
      data: plans,
    })
  } catch (error) {
    console.error('Error fetching subscription plans:', error)

    // Last resort: try direct database fetch
    try {
      const plans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      })
      return NextResponse.json({
        success: true,
        data: plans,
      })
    } catch (dbError) {
      console.error('Database fallback also failed:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch subscription plans' },
        { status: 500 }
      )
    }
  }
}

// Can be cached since plans rarely change
export const dynamic = 'force-dynamic'
