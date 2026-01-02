/**
 * Admin API: Update Organization Features
 * Allows admin to enable/disable features for organizations
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // TODO: Add admin role check here
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enabledFeatures } = await request.json()

    if (!Array.isArray(enabledFeatures)) {
      return NextResponse.json(
        { error: 'enabledFeatures must be an array' },
        { status: 400 }
      )
    }

    // Await params in Next.js 15+
    const { id } = await params

    // Update organization
    const organization = await prisma.organization.update({
      where: { id },
      data: {
        enabledFeatures: JSON.stringify(enabledFeatures),
      },
      select: {
        id: true,
        name: true,
        enabledFeatures: true,
      },
    })

    return NextResponse.json({
      success: true,
      organization,
    })
  } catch (error) {
    console.error('Error updating organization features:', error)
    return NextResponse.json(
      { error: 'Failed to update features' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
