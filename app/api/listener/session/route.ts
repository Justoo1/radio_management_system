/**
 * Listener Session Tracking API
 * Tracks when users start/stop listening to programs
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

// Start a new listener session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { programId, platform = 'WEB' } = body

    // Get IP address and user agent
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || undefined

    // Get organization from program
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { organizationId: true },
    })

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Create listener session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const session = await prisma.listenerSession.create({
      data: {
        sessionId,
        organizationId: program.organizationId,
        programId,
        ipAddress,
        userAgent,
        platform: platform as any,
        startedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      id: session.id,
    })
  } catch (error) {
    console.error('Error creating listener session:', error)
    return NextResponse.json(
      { error: 'Failed to start session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// End a listener session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    const session = await prisma.listenerSession.findUnique({
      where: { sessionId },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const endedAt = new Date()
    const durationSeconds = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000)

    await prisma.listenerSession.update({
      where: { sessionId },
      data: {
        endedAt,
        durationSeconds,
      },
    })

    return NextResponse.json({
      success: true,
      durationSeconds,
    })
  } catch (error) {
    console.error('Error ending listener session:', error)
    return NextResponse.json(
      { error: 'Failed to end session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Get current listener count for a program
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')

    if (!programId) {
      return NextResponse.json({ error: 'Program ID required' }, { status: 400 })
    }

    // Get active sessions (started in last 5 minutes and not ended)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const activeSessions = await prisma.listenerSession.count({
      where: {
        programId,
        startedAt: { gte: fiveMinutesAgo },
        endedAt: null,
      },
    })

    // Get total sessions today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const totalToday = await prisma.listenerSession.count({
      where: {
        programId,
        startedAt: { gte: todayStart },
      },
    })

    return NextResponse.json({
      currentListeners: activeSessions,
      totalToday,
    })
  } catch (error) {
    console.error('Error getting listener count:', error)
    return NextResponse.json(
      { error: 'Failed to get listener count', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
