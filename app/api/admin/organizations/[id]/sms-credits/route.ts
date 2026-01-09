/**
 * Admin API: Manage Organization SMS Credits
 * Allows admin to view and manage SMS credit limits and balances
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import {
  getOrCreateCredits,
  setMonthlyAllocation,
  addCredits
} from '@/lib/services/sms-credits'

/**
 * GET /api/admin/organizations/[id]/sms-credits
 * Get SMS credit information for an organization
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for developer access cookie
    const cookieStore = await cookies()
    const devAccessToken = cookieStore.get('dev_access_token')

    if (!devAccessToken || !devAccessToken.value) {
      return NextResponse.json({ error: 'Unauthorized - Developer access required' }, { status: 401 })
    }

    const { id: organizationId } = await params

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
      },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get SMS credits
    const credits = await getOrCreateCredits(organizationId)

    // Get SMS usage history (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentCampaigns = await prisma.sMSCampaign.findMany({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        name: true,
        status: true,
        totalRecipients: true,
        sentCount: true,
        deliveredCount: true,
        failedCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Calculate usage stats
    const totalSentThisMonth = await prisma.sMSMessage.count({
      where: {
        campaign: {
          organizationId,
        },
        status: 'SENT',
        sentAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
        },
        credits: {
          balance: credits.balance,
          totalPurchased: credits.totalPurchased,
          totalUsed: credits.totalUsed,
          monthlyAllocation: credits.monthlyAllocation,
          monthlyUsed: credits.monthlyUsed,
          monthlyRemaining: Math.max(0, credits.monthlyAllocation - credits.monthlyUsed),
          totalAvailable: credits.balance + Math.max(0, credits.monthlyAllocation - credits.monthlyUsed),
          allocationResetAt: credits.allocationResetAt,
        },
        usage: {
          totalSentThisMonth,
          recentCampaigns,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching SMS credits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SMS credits' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/organizations/[id]/sms-credits
 * Update SMS credit settings for an organization
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for developer access cookie
    const cookieStore = await cookies()
    const devAccessToken = cookieStore.get('dev_access_token')

    if (!devAccessToken || !devAccessToken.value) {
      return NextResponse.json({ error: 'Unauthorized - Developer access required' }, { status: 401 })
    }

    const { id: organizationId } = await params
    const body = await request.json()

    // Validate organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const { action, monthlyAllocation, creditsToAdd, notes } = body

    let result: any = {}

    switch (action) {
      case 'SET_MONTHLY_ALLOCATION': {
        // Set the monthly SMS limit
        if (typeof monthlyAllocation !== 'number' || monthlyAllocation < 0) {
          return NextResponse.json(
            { error: 'Invalid monthly allocation value' },
            { status: 400 }
          )
        }

        await setMonthlyAllocation(organizationId, monthlyAllocation)

        // Log to console for admin actions
        console.log(`[ADMIN] SMS allocation updated for ${organization.name}: ${monthlyAllocation}${notes ? ` - ${notes}` : ''}`)

        result = {
          message: `Monthly allocation set to ${monthlyAllocation}`,
          monthlyAllocation,
        }
        break
      }

      case 'ADD_CREDITS': {
        // Add bonus/purchased credits
        if (typeof creditsToAdd !== 'number' || creditsToAdd <= 0) {
          return NextResponse.json(
            { error: 'Invalid credits amount' },
            { status: 400 }
          )
        }

        await addCredits(organizationId, creditsToAdd)

        // Log to console for admin actions
        console.log(`[ADMIN] SMS credits added for ${organization.name}: ${creditsToAdd}${notes ? ` - ${notes}` : ''}`)

        result = {
          message: `${creditsToAdd} credits added successfully`,
          creditsAdded: creditsToAdd,
        }
        break
      }

      case 'RESET_MONTHLY_USAGE': {
        // Reset monthly usage counter (for special cases)
        await prisma.sMSCredit.update({
          where: { organizationId },
          data: {
            monthlyUsed: 0,
          } as any,
        })

        // Log to console for admin actions
        console.log(`[ADMIN] SMS monthly usage reset for ${organization.name}${notes ? ` - ${notes}` : ''}`)

        result = {
          message: 'Monthly usage counter reset',
        }
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use SET_MONTHLY_ALLOCATION, ADD_CREDITS, or RESET_MONTHLY_USAGE' },
          { status: 400 }
        )
    }

    // Get updated credits
    const updatedCredits = await getOrCreateCredits(organizationId)

    return NextResponse.json({
      success: true,
      ...result,
      credits: {
        balance: updatedCredits.balance,
        totalPurchased: updatedCredits.totalPurchased,
        totalUsed: updatedCredits.totalUsed,
        monthlyAllocation: updatedCredits.monthlyAllocation,
        monthlyUsed: updatedCredits.monthlyUsed,
        monthlyRemaining: Math.max(0, updatedCredits.monthlyAllocation - updatedCredits.monthlyUsed),
        totalAvailable: updatedCredits.balance + Math.max(0, updatedCredits.monthlyAllocation - updatedCredits.monthlyUsed),
      },
    })
  } catch (error) {
    console.error('Error updating SMS credits:', error)
    return NextResponse.json(
      { error: 'Failed to update SMS credits' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
