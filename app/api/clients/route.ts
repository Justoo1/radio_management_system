/**
 * Clients API Endpoints
 * GET /api/clients - Fetch clients
 * POST /api/clients - Create client
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clientSchema } from '@/lib/validations/client'

/**
 * GET /api/clients
 * Fetch all clients for the organization
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
    const categoryId = searchParams.get('categoryId')

    const skip = (page - 1) * pageSize

    // Build where clause for multi-tenant filtering
    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    // Fetch clients with pagination
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          contactPersons: true,
          category: true,
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ])

    return NextResponse.json({
      data: clients,
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
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/clients
 * Create a new client
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
    const validatedData = clientSchema.parse(body)

    // Check feature limit
    const clientCount = await prisma.client.count({
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

    if (clientCount >= org.maxClients) {
      return NextResponse.json(
        {
          error: 'Client limit reached',
          message: `Your plan allows a maximum of ${org.maxClients} clients`,
        },
        { status: 400 }
      )
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
        createdById: session.user.id,
        status: validatedData.status || 'ACTIVE',
      },
      include: {
        contactPersons: true,
        category: true,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
