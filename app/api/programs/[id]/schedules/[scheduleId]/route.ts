/**
 * Individual Program Schedule API
 * GET /api/programs/[id]/schedules/[scheduleId] - Get schedule
 * PATCH /api/programs/[id]/schedules/[scheduleId] - Update schedule
 * DELETE /api/programs/[id]/schedules/[scheduleId] - Delete schedule
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/programs/[id]/schedules/[scheduleId]
 * Get a specific schedule
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: programId, scheduleId } = await params

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

    // Get schedule
    const schedule = await prisma.programSchedule.findFirst({
      where: {
        id: scheduleId,
        programId,
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/programs/[id]/schedules/[scheduleId]
 * Update a schedule
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: programId, scheduleId } = await params
    const body = await req.json()

    const { dayOfWeek, startTime, endTime, isRecurring, startDate, endDate, notes, isActive } = body

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

    // Verify schedule belongs to program
    const schedule = await prisma.programSchedule.findFirst({
      where: {
        id: scheduleId,
        programId,
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // Validate dayOfWeek if provided
    if (dayOfWeek !== undefined && (dayOfWeek < 0 || dayOfWeek > 6)) {
      return NextResponse.json(
        { error: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' },
        { status: 400 }
      )
    }

    // Validate times if provided
    const newStartTime = startTime || schedule.startTime
    const newEndTime = endTime || schedule.endTime

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(newStartTime) || !timeRegex.test(newEndTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM format.' },
        { status: 400 }
      )
    }

    const [startHour, startMin] = newStartTime.split(':').map(Number)
    const [endHour, endMin] = newEndTime.split(':').map(Number)
    const startTotalMins = startHour * 60 + startMin
    const endTotalMins = endHour * 60 + endMin

    if (endTotalMins <= startTotalMins) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Check for overlapping schedules on the same day (excluding this schedule)
    const newDayOfWeek = dayOfWeek !== undefined ? dayOfWeek : schedule.dayOfWeek
    const existingSchedules = await prisma.programSchedule.findMany({
      where: {
        programId,
        dayOfWeek: newDayOfWeek,
        isActive: true,
        NOT: {
          id: scheduleId,
        },
      },
    })

    const hasConflict = existingSchedules.some((otherSchedule) => {
      const [existingStartHour, existingStartMin] = otherSchedule.startTime.split(':').map(Number)
      const [existingEndHour, existingEndMin] = otherSchedule.endTime.split(':').map(Number)
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

    // Update schedule
    const updated = await prisma.programSchedule.update({
      where: { id: scheduleId },
      data: {
        ...(dayOfWeek !== undefined && { dayOfWeek }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating schedule:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/programs/[id]/schedules/[scheduleId]
 * Delete a schedule
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: programId, scheduleId } = await params

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

    // Verify schedule belongs to program
    const schedule = await prisma.programSchedule.findFirst({
      where: {
        id: scheduleId,
        programId,
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // Delete schedule
    await prisma.programSchedule.delete({
      where: { id: scheduleId },
    })

    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}
