/**
 * Program Detail API Endpoints
 * GET /api/programs/[id] - Fetch specific program
 * PATCH /api/programs/[id] - Update program
 * DELETE /api/programs/[id] - Delete program
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { programSchema } from '@/lib/validations/program'

/**
 * GET /api/programs/[id]
 * Fetch a specific program
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

    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        schedules: true,
        episodes: true,
      },
    })

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (program.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error fetching program:', error)
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/programs/[id]
 * Update a program
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

    // Verify program exists and belongs to organization
    const existingProgram = await prisma.program.findUnique({
      where: { id },
    })

    if (!existingProgram) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    if (existingProgram.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = programSchema.partial().parse(body)

    const updatedProgram = await prisma.program.update({
      where: { id },
      data: validatedData as any,
      include: {
        schedules: true,
        episodes: true,
      },
    })

    return NextResponse.json(updatedProgram)
  } catch (error) {
    console.error('Error updating program:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/programs/[id]
 * Delete a program
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

    // Verify program exists and belongs to organization
    const existingProgram = await prisma.program.findUnique({
      where: { id },
    })

    if (!existingProgram) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    if (existingProgram.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await prisma.program.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Program deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting program:', error)
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    )
  }
}
