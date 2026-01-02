/**
 * Cron Job: Generate Monthly Bills
 * Runs monthly to create bills for all active organizations
 * Should be called from a cron service (e.g., Vercel Cron, GitHub Actions)
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { FEATURES, getPremiumFeatures, parseEnabledFeatures } from '@/lib/features'

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (use a secret token for cron jobs)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentYear = now.getFullYear()

    // Get due date (25th of current month)
    const dueDate = new Date(currentYear, currentMonth - 1, 25)

    // Get all active organizations
    const organizations = await prisma.organization.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'TRIAL'],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        enabledFeatures: true,
        bills: {
          where: {
            billingMonth: currentMonth,
            billingYear: currentYear,
          },
        },
      },
    })

    const billsCreated: string[] = []
    const billsSkipped: string[] = []

    for (const org of organizations) {
      // Skip if bill already exists for this month
      if (org.bills.length > 0) {
        billsSkipped.push(org.name)
        continue
      }

      // Calculate bill amount based on enabled features
      const enabledFeatures = parseEnabledFeatures(org.enabledFeatures)
      const premiumFeatures = getPremiumFeatures()
      const enabledPremiumCount = premiumFeatures.filter((f) =>
        enabledFeatures.includes(f.key)
      ).length

      let amount = 500 // Starter plan (GH₵ 500)
      let description = 'Starter Plan - Core Features'

      if (enabledPremiumCount >= premiumFeatures.length) {
        amount = 1200 // Professional plan (GH₵ 1,200)
        description = 'Professional Plan - All Features'
      } else if (enabledPremiumCount > 0) {
        // Custom pricing based on number of premium features
        amount = 500 + (enabledPremiumCount * 150) // Base + 150 per premium feature
        description = `Custom Plan - Core + ${enabledPremiumCount} Premium Features`
      }

      // Create the bill
      await prisma.bill.create({
        data: {
          organizationId: org.id,
          billingMonth: currentMonth,
          billingYear: currentYear,
          amount,
          description,
          dueDate,
          status: 'PENDING',
        },
      })

      billsCreated.push(org.name)
    }

    return NextResponse.json({
      success: true,
      message: `Generated bills for ${billsCreated.length} organizations`,
      billsCreated,
      billsSkipped,
      month: currentMonth,
      year: currentYear,
    })
  } catch (error) {
    console.error('Error generating bills:', error)
    return NextResponse.json(
      { error: 'Failed to generate bills', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
