/**
 * Check Organization Status API Route
 * Checks if a user's organization is suspended/expired before login
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user and their organization
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: {
          select: {
            status: true,
          },
        },
      },
    })

    // If user not found, return success (don't leak user existence)
    if (!user || !user.organization) {
      return NextResponse.json({ status: 'UNKNOWN' })
    }

    // Return organization status
    return NextResponse.json({
      status: user.organization.status,
    })
  } catch (error) {
    console.error('Error checking organization status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
