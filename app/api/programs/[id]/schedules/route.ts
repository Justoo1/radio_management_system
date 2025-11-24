/**
 * Program Schedules API
 * GET /api/programs/[id]/schedules - List schedules for a program
 * POST /api/programs/[id]/schedules - Create schedule
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/programs/[id]/schedules
 * List all schedules for a program
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

    // Get schedules
    const schedules = await prisma.programSchedule.findMany({
      where: { programId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json({
      data: schedules,
      total: schedules.length,
    })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/programs/[id]/schedules
 * Create a new schedule for a program
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

    const { dayOfWeek, startTime, endTime, isRecurring, startDate, endDate, notes, isActive } = body

    // Validate required fields
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: dayOfWeek, startTime, endTime' },
        { status: 400 }
      )
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' },
        { status: 400 }
      )
    }

    // Verify time format and endTime > startTime
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM format.' },
        { status: 400 }
      )
    }

    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startTotalMins = startHour * 60 + startMin
    const endTotalMins = endHour * 60 + endMin

    if (endTotalMins <= startTotalMins) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
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

    // Check for overlapping schedules on the same day for the same program
    const existingSchedules = await prisma.programSchedule.findMany({
      where: {
        programId,
        dayOfWeek,
        isActive: true,
      },
    })

    const hasConflict = existingSchedules.some((schedule) => {
      const [existingStartHour, existingStartMin] = schedule.startTime.split(':').map(Number)
      const [existingEndHour, existingEndMin] = schedule.endTime.split(':').map(Number)
      const existingStartMins = existingStartHour * 60 + existingStartMin
      const existingEndMins = existingEndHour * 60 + existingEndMin

      // Check if times overlap
      return !(endTotalMins <= existingStartMins || startTotalMins >= existingEndMins)
    })

    if (hasConflict) {
      return NextResponse.json(
        { error: 'Schedule overlaps with an existing schedule on this day' },
        { status: 409 }
      )
    }

    // Create schedule
    const schedule = await prisma.programSchedule.create({
      data: {
        programId,
        dayOfWeek,
        startTime,
        endTime,
        isRecurring: isRecurring !== false,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        notes: notes || null,
        isActive: isActive !== false,
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}
