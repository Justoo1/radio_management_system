/**
 * Programs API Endpoints
 * GET /api/programs - Fetch programs
 * POST /api/programs - Create program
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { programSchema } from '@/lib/validations/program'

/**
 * GET /api/programs
 * Fetch all programs for the organization
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
    const status = searchParams.get('status')

    const skip = (page - 1) * pageSize

    // Build where clause for multi-tenant filtering
    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.isActive = status === 'ACTIVE'
    }

    // Fetch programs with pagination
    const [programs, total] = await Promise.all([
      prisma.program.findMany({
        where,
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          schedules: true,
          episodes: true,
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.program.count({ where }),
    ])

    return NextResponse.json({
      data: programs,
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
    console.error('Error fetching programs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/programs
 * Create a new program
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
    const validatedData = programSchema.parse(body)

    // Check feature limit
    const programCount = await prisma.program.count({
      where: { organizationId: session.user.organizationId },
    })

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
    })

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    if (programCount >= (org as any).maxPrograms) {
      return NextResponse.json(
        {
          error: 'Program limit reached',
          message: `Your plan allows a maximum of ${(org as any).maxPrograms} programs`,
        },
        { status: 400 }
      )
    }

    // Create program
    const program = await prisma.program.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
        coHosts: validatedData.coHosts ? JSON.stringify(validatedData.coHosts) : null,
      } as any,
      include: {
        schedules: true,
        episodes: true,
      },
    })

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error('Error creating program:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    )
  }
}
