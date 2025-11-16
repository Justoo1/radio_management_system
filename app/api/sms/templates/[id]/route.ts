/**
 * SMS Template Detail API Endpoints
 * GET /api/sms/templates/[id] - Fetch specific template
 * PATCH /api/sms/templates/[id] - Update template
 * DELETE /api/sms/templates/[id] - Delete template
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { smsTemplateSchema } from '@/lib/validations/sms'

/**
 * GET /api/sms/templates/[id]
 * Fetch a specific SMS template
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

    const template = await prisma.sMSTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if ((template as any).organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching SMS template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SMS template' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/sms/templates/[id]
 * Update an SMS template
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

    // Verify template exists and belongs to organization
    const existingTemplate = await prisma.sMSTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    if ((existingTemplate as any).organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = smsTemplateSchema.partial().parse(body)

    const updatedTemplate = await prisma.sMSTemplate.update({
      where: { id },
      data: validatedData as any,
    })

    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error('Error updating SMS template:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update SMS template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sms/templates/[id]
 * Delete an SMS template
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

    // Verify template exists and belongs to organization
    const existingTemplate = await prisma.sMSTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    if ((existingTemplate as any).organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await prisma.sMSTemplate.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Template deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting SMS template:', error)
    return NextResponse.json(
      { error: 'Failed to delete SMS template' },
      { status: 500 }
    )
  }
}
