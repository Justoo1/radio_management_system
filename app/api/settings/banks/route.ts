/**
 * Banks API
 * Get list of supported banks from Paystack
 */

import { NextResponse } from 'next/server'
import { getPaystackService } from '@/lib/integrations/paystack'

export async function GET() {
  try {
    const paystack = getPaystackService()
    const response = await paystack.listBanks('ghana', 'GHS')

    if (!response.status) {
      throw new Error('Failed to fetch banks from Paystack')
    }

    return NextResponse.json({
      success: true,
      data: response.data,
    })
  } catch (error) {
    console.error('Error fetching banks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banks' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
