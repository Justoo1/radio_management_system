/**
 * API Route: Get Today's Program Schedule
 * Returns programs scheduled for today
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTodaysScheduledPrograms } from '@/lib/services/onair';

/**
 * GET /api/onair/schedule
 * Get today's scheduled programs
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedule = await getTodaysScheduledPrograms(session.user.organizationId);

    // Transform the data to include friendly display
    const transformedSchedule = schedule.map((item) => {
      // Calculate actual duration from schedule times
      const [startHour, startMin] = item.startTime.split(':').map(Number);
      const [endHour, endMin] = item.endTime.split(':').map(Number);
      const startTotalMins = startHour * 60 + startMin;
      const endTotalMins = endHour * 60 + endMin;
      const scheduledDuration = Math.max(endTotalMins - startTotalMins, 0);

      return {
        id: item.id,
        programId: item.program.id,
        programName: item.program.name,
        description: item.program.description,
        genre: item.program.genre,
        duration: scheduledDuration || item.program.duration, // Use scheduled duration if available
        startTime: item.startTime,
        endTime: item.endTime,
        host: item.program.host
          ? {
              id: item.program.host.id,
              name: item.program.host.name,
            }
          : null,
        thumbnailUrl: item.program.thumbnailUrl,
        dayOfWeek: item.dayOfWeek,
        isActive: item.isActive,
        notes: item.notes,
      };
    });

    return NextResponse.json({ schedule: transformedSchedule });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}
