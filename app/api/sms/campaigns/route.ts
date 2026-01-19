/**
 * SMS Campaigns API Endpoints
 * GET /api/sms/campaigns - Fetch campaigns
 * POST /api/sms/campaigns - Create campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { smsCampaignSchema } from '@/lib/validations/sms'
import { Feature, isFeatureEnabled, parseEnabledFeatures } from '@/lib/features'

/**
 * Check if SMS campaigns feature is enabled for organization
 */
async function checkSMSFeatureAccess(organizationId: string): Promise<{ hasAccess: boolean; organization: any }> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      enabledFeatures: true,
      maxSMSPerMonth: true,
      status: true,
    },
  })

  if (!organization) {
    return { hasAccess: false, organization: null }
  }

  // Check if organization is active
  if (organization.status === 'SUSPENDED' || organization.status === 'CANCELLED') {
    return { hasAccess: false, organization }
  }

  const enabledFeatures = parseEnabledFeatures(organization.enabledFeatures)
  const hasAccess = isFeatureEnabled(enabledFeatures, Feature.SMS_CAMPAIGNS)

  return { hasAccess, organization }
}

/**
 * GET /api/sms/campaigns
 * Fetch all SMS campaigns for the organization
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check feature access
    const { hasAccess } = await checkSMSFeatureAccess(session.user.organizationId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'SMS Campaigns feature is not enabled for your organization. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')

    const skip = (page - 1) * pageSize

    // Build where clause for multi-tenant filtering
    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    // Fetch campaigns with pagination
    const [campaigns, total] = await Promise.all([
      prisma.sMSCampaign.findMany({
        where,
        include: {
          template: true,
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sMSCampaign.count({ where }),
    ])

    return NextResponse.json({
      data: campaigns,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching SMS campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SMS campaigns' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sms/campaigns
 * Create a new SMS campaign
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check feature access
    const { hasAccess, organization: org } = await checkSMSFeatureAccess(session.user.organizationId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'SMS Campaigns feature is not enabled for your organization. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const validatedData = smsCampaignSchema.parse(body)

    // If template is provided, verify it belongs to organization
    if (validatedData.templateId) {
      const template = await prisma.sMSTemplate.findUnique({
        where: { id: validatedData.templateId },
      })

      if (!template || (template as any).organizationId !== session.user.organizationId) {
        return NextResponse.json(
          { error: 'Invalid template' },
          { status: 400 }
        )
      }
    }

    // Create campaign
    const campaign = await prisma.sMSCampaign.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
        status: 'DRAFT',
      } as any,
      include: {
        template: true,
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Error creating SMS campaign:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create SMS campaign' },
      { status: 500 }
    )
  }
}
