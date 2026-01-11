import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/public/streaming/[slug]/schedule - Get today's program schedule
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Find organization by slug
    const organization = await prisma.organization.findFirst({
      where: { slug },
      include: {
        streamingConfig: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 }
      )
    }

    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const now = new Date()
    const currentDay = now.getDay()

    // Get current time in HH:MM format
    const currentTime = now.toTimeString().slice(0, 5)

    // Fetch today's program schedule
    const schedules = await prisma.programSchedule.findMany({
      where: {
        program: {
          organizationId: organization.id,
          status: {
            in: ['SCHEDULED', 'LIVE'],
          },
        },
        dayOfWeek: currentDay,
        isActive: true,
      },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            host: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    // Transform to public schedule format
    const schedule = schedules.map((item) => {
      const startTime = item.startTime.slice(0, 5) // HH:MM
      const endTime = item.endTime.slice(0, 5)

      // Check if program is currently live
      const isLive = currentTime >= startTime && currentTime < endTime

      return {
        id: item.id,
        name: item.program.name,
        startTime: formatTime12Hour(startTime),
        endTime: formatTime12Hour(endTime),
        host: item.program.host?.name || undefined,
        isLive,
      }
    })

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

// Helper to convert 24h time to 12h format
function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}
