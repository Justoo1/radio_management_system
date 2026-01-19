/**
 * Admin: Fix Organization Features
 * Migrates old uppercase feature names to lowercase to match Feature enum
 * POST /api/admin/fix-features
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidateOrgCache } from '@/lib/cache'

// Mapping from old feature names to new feature names
const FEATURE_MAPPING: Record<string, string> = {
  'SMS_CAMPAIGNS': 'sms_campaigns',
  'ADVERTISEMENTS': 'advertisements',
  'MEDIA_LIBRARY': 'media_library',
  'WHATSAPP': 'whatsapp_integration',
  'EXPENSES': 'expenses',
  'ADVANCED_ANALYTICS': 'advanced_analytics',
  'REVENUE_REPORTS': 'report_revenue',
  'CONTRACT_ANALYSIS': 'report_contracts',
  'INVOICE_AGING': 'report_aging',
  'CLIENT_ANALYTICS': 'report_client_analytics',
  'PROGRAM_ANALYTICS': 'report_program_analytics',
  'SMS_ANALYTICS': 'report_sms_analytics',
  'LISTENER_TRACKING': 'listener_tracking',
  'STREAMING': 'streaming',
  'AIRTIME': 'airtime',
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Only allow admins or check for special header
    const isAdmin = request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY

    if (!isAdmin && session?.user?.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all organizations
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        enabledFeatures: true,
      },
    })

    const results: Array<{
      id: string
      name: string
      oldFeatures: string[]
      newFeatures: string[]
      updated: boolean
    }> = []

    for (const org of organizations) {
      try {
        const oldFeatures: string[] = JSON.parse(org.enabledFeatures || '[]')

        // Check if any features need migration
        const hasOldFeatures = oldFeatures.some(f => FEATURE_MAPPING[f])

        if (hasOldFeatures) {
          // Map old feature names to new ones
          const newFeatures = oldFeatures.map(feature => {
            return FEATURE_MAPPING[feature] || feature.toLowerCase()
          })

          // Remove duplicates
          const uniqueNewFeatures = [...new Set(newFeatures)]

          // Update organization
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              enabledFeatures: JSON.stringify(uniqueNewFeatures),
            },
          })

          // Invalidate cache
          await invalidateOrgCache(org.id)

          results.push({
            id: org.id,
            name: org.name,
            oldFeatures,
            newFeatures: uniqueNewFeatures,
            updated: true,
          })
        } else {
          results.push({
            id: org.id,
            name: org.name,
            oldFeatures,
            newFeatures: oldFeatures,
            updated: false,
          })
        }
      } catch (parseError) {
        console.error(`Error parsing features for org ${org.id}:`, parseError)
      }
    }

    const updatedCount = results.filter(r => r.updated).length

    return NextResponse.json({
      success: true,
      message: `Fixed features for ${updatedCount} organizations`,
      totalOrganizations: organizations.length,
      updatedOrganizations: updatedCount,
      results,
    })
  } catch (error) {
    console.error('Error fixing features:', error)
    return NextResponse.json(
      { error: 'Failed to fix features' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
