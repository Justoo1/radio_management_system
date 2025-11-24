/**
 * Program Episodes API
 * GET /api/programs/[id]/episodes - List episodes for a program
 * POST /api/programs/[id]/episodes - Create episode
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/programs/[id]/episodes
 * List all episodes for a program
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

    const { id: programId } = await params

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

    // Get episodes
    const episodes = await prisma.programEpisode.findMany({
      where: { programId },
      orderBy: { airDate: 'desc' },
    })

    return NextResponse.json({
      data: episodes,
      total: episodes.length,
    })
  } catch (error) {
    console.error('Error fetching episodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/programs/[id]/episodes
 * Create a new episode for a program
 */
export async function POST(
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

    const { id: programId } = await params
    const body = await req.json()

    const { episodeNumber, title, description, airDate, status, transcript, guestNames, topics } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Episode title is required' },
        { status: 400 }
      )
    }

    if (!airDate) {
      return NextResponse.json(
        { error: 'Episode air date is required' },
        { status: 400 }
      )
    }

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

    // Create episode
    const episode = await prisma.programEpisode.create({
      data: {
        programId,
        episodeNumber: episodeNumber || null,
        title,
        description: description || null,
        airDate: new Date(airDate),
        status: status || 'SCHEDULED',
        transcript: transcript || null,
        guestNames: guestNames || null,
        topics: topics || null,
      },
    })

    return NextResponse.json(episode, { status: 201 })
  } catch (error) {
    console.error('Error creating episode:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create episode' },
      { status: 500 }
    )
  }
}
