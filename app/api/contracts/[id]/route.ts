/**
 * Individual Contract API Endpoints
 * GET /api/contracts/[id] - Get contract details
 * PUT /api/contracts/[id] - Update contract
 * DELETE /api/contracts/[id] - Delete contract
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateContractSchema } from '@/lib/validations/contract'

/**
 * GET /api/contracts/[id]
 * Get contract details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!contract || contract.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/contracts/[id]
 * Update contract
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = updateContractSchema.parse(body)

    // Verify contract exists and belongs to organization
    const contract = await prisma.contract.findUnique({
      where: { id },
    })

    if (!contract || contract.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Update contract
    const updatedContract = await prisma.contract.update({
      where: { id },
      data: validatedData,
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

    return NextResponse.json(updatedContract)
  } catch (error) {
    console.error('Error updating contract:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/contracts/[id]
 * Delete contract (only drafts)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify contract exists and belongs to organization
    const contract = await prisma.contract.findUnique({
      where: { id },
    })

    if (!contract || contract.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of draft contracts
    if (contract.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft contracts can be deleted' },
        { status: 400 }
      )
    }

    // Delete contract
    await prisma.contract.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    )
  }
}
