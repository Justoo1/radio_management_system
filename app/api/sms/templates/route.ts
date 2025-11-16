/**
 * SMS Templates API Endpoints
 * GET /api/sms/templates - Fetch templates
 * POST /api/sms/templates - Create template
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { smsTemplateSchema } from '@/lib/validations/sms'

/**
 * GET /api/sms/templates
 * Fetch all SMS templates for the organization
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

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * pageSize

    // Build where clause for multi-tenant filtering
    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch templates with pagination
    const [templates, total] = await Promise.all([
      prisma.sMSTemplate.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sMSTemplate.count({ where }),
    ])

    return NextResponse.json({
      data: templates,
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
    console.error('Error fetching SMS templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SMS templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sms/templates
 * Create a new SMS template
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

    const body = await req.json()
    const validatedData = smsTemplateSchema.parse(body)

    // Create template
    const template = await prisma.sMSTemplate.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
      } as any,
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating SMS template:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create SMS template' },
      { status: 500 }
    )
  }
}
