/**
 * Individual Program Episode API
 * GET /api/programs/[id]/episodes/[episodeId] - Get episode
 * PATCH /api/programs/[id]/episodes/[episodeId] - Update episode
 * DELETE /api/programs/[id]/episodes/[episodeId] - Delete episode
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/programs/[id]/episodes/[episodeId]
 * Get a specific episode
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: programId, episodeId } = await params

    // Verify program belongs to this organization
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { organizationId: true },
    })

    if (!program || program.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    // Get episode
    const episode = await prisma.programEpisode.findFirst({
      where: {
        id: episodeId,
        programId,
      },
    })

    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(episode)
  } catch (error) {
    console.error('Error fetching episode:', error)
    return NextResponse.json(
      { error: 'Failed to fetch episode' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/programs/[id]/episodes/[episodeId]
 * Update an episode
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: programId, episodeId } = await params
    const body = await req.json()

    const { episodeNumber, title, description, airDate, status, transcript, guestNames, topics } = body

    // Verify program belongs to this organization
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { organizationId: true },
    })

    if (!program || program.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    // Verify episode belongs to program
    const episode = await prisma.programEpisode.findFirst({
      where: {
        id: episodeId,
        programId,
      },
    })

    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      )
    }

    // Update episode
    const updated = await prisma.programEpisode.update({
      where: { id: episodeId },
      data: {
        ...(episodeNumber !== undefined && { episodeNumber: episodeNumber || null }),
        ...(title && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(airDate && { airDate: new Date(airDate) }),
        ...(status && { status }),
        ...(transcript !== undefined && { transcript: transcript || null }),
        ...(guestNames !== undefined && { guestNames }),
        ...(topics !== undefined && { topics }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating episode:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update episode' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/programs/[id]/episodes/[episodeId]
 * Delete an episode
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: programId, episodeId } = await params

    // Verify program belongs to this organization
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { organizationId: true },
    })

    if (!program || program.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    // Verify episode belongs to program
    const episode = await prisma.programEpisode.findFirst({
      where: {
        id: episodeId,
        programId,
      },
    })

    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      )
    }

    // Delete episode
    await prisma.programEpisode.delete({
      where: { id: episodeId },
    })

    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error) {
    console.error('Error deleting episode:', error)
    return NextResponse.json(
      { error: 'Failed to delete episode' },
      { status: 500 }
    )
  }
}
