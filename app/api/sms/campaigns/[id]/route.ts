/**
 * SMS Campaign Detail API Endpoints
 * GET /api/sms/campaigns/[id] - Fetch specific campaign
 * PATCH /api/sms/campaigns/[id] - Update campaign
 * DELETE /api/sms/campaigns/[id] - Delete campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { smsCampaignSchema } from '@/lib/validations/sms'

/**
 * GET /api/sms/campaigns/[id]
 * Fetch a specific SMS campaign
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaign = await prisma.sMSCampaign.findUnique({
      where: { id },
      include: {
        template: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (campaign.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error fetching SMS campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SMS campaign' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/sms/campaigns/[id]
 * Update an SMS campaign
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify campaign exists and belongs to organization
    const existingCampaign = await prisma.sMSCampaign.findUnique({
      where: { id },
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (existingCampaign.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Prevent updating campaigns that are already sent
    if (existingCampaign.status === 'SENT') {
      return NextResponse.json(
        { error: 'Cannot update a sent campaign' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = smsCampaignSchema.partial().parse(body)

    // If template is being updated, verify it belongs to organization
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

    const updatedCampaign = await prisma.sMSCampaign.update({
      where: { id },
      data: validatedData as any,
      include: {
        template: true,
      },
    })

    return NextResponse.json(updatedCampaign)
  } catch (error) {
    console.error('Error updating SMS campaign:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update SMS campaign' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sms/campaigns/[id]
 * Delete an SMS campaign
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify campaign exists and belongs to organization
    const existingCampaign = await prisma.sMSCampaign.findUnique({
      where: { id },
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (existingCampaign.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Prevent deleting campaigns that are already sent
    if (existingCampaign.status === 'SENT') {
      return NextResponse.json(
        { error: 'Cannot delete a sent campaign' },
        { status: 400 }
      )
    }

    await prisma.sMSCampaign.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Campaign deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting SMS campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete SMS campaign' },
      { status: 500 }
    )
  }
}
