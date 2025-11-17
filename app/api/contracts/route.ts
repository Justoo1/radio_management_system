/**
 * Contracts API Endpoints
 * GET /api/contracts - List contracts with filtering
 * POST /api/contracts - Create contract
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createContractSchema } from '@/lib/validations/contract'

/**
 * GET /api/contracts
 * List all contracts with filtering, pagination
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
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const search = searchParams.get('search')
    const minValue = searchParams.get('minValue')
    const maxValue = searchParams.get('maxValue')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * pageSize

    // Build where clause for multi-tenant filtering
    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (status) {
      where.status = status
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (minValue) {
      where.value = {
        gte: parseFloat(minValue),
      }
    }

    if (maxValue) {
      if (where.value) {
        where.value.lte = parseFloat(maxValue)
      } else {
        where.value = {
          lte: parseFloat(maxValue),
        }
      }
    }

    if (startDate) {
      where.startDate = {
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      if (where.startDate) {
        where.startDate.lte = new Date(endDate)
      } else {
        where.startDate = {
          lte: new Date(endDate),
        }
      }
    }

    // Fetch contracts with pagination
    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contract.count({ where }),
    ])

    // Calculate summary
    const summary = await prisma.contract.aggregate({
      where: {
        organizationId: session.user.organizationId,
      },
      _count: true,
      _sum: {
        value: true,
      },
    })

    return NextResponse.json({
      data: contracts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrev: page > 1,
      },
      summary: {
        totalContracts: summary._count,
        totalValue: summary._sum.value || 0,
        activeCount: await prisma.contract.count({
          where: {
            organizationId: session.user.organizationId,
            status: 'ACTIVE',
          },
        }),
        expiredCount: await prisma.contract.count({
          where: {
            organizationId: session.user.organizationId,
            status: 'EXPIRED',
          },
        }),
      },
    })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contracts
 * Create a new contract
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
    const validatedData = createContractSchema.parse(body)

    // Verify client exists and belongs to organization
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId },
    })

    if (!client || client.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Create contract
    const contract = await prisma.contract.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
        status: 'DRAFT',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('Error creating contract:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    )
  }
}
