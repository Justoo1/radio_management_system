/**
 * Programs Analytics Report API
 * Returns detailed analytics for radio programs using REAL engagement data
 * Designed for Traditional FM Radio Stations
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Feature, checkFeatureAccess } from '@/lib/features'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const organizationId = user.organizationId

    // Check program analytics report feature access
    const { hasAccess } = await checkFeatureAccess(prisma, organizationId, Feature.REPORT_PROGRAM_ANALYTICS)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Program analytics report is not enabled for your organization. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Get program data with REAL engagement metrics
    const programs = await prisma.program.findMany({
      where: { organizationId },
      include: {
        host: {
          select: {
            name: true,
          },
        },
        schedules: {
          where: { isActive: true },
        },
        episodes: {
          orderBy: { airDate: 'desc' },
          take: 10,
        },
        // Listener requests (SMS, WhatsApp, Phone calls)
        listenerRequests: {
          select: {
            id: true,
            requestType: true,
            source: true,
            createdAt: true,
          },
        },
        // Program ratings
        ratings: {
          select: {
            rating: true,
            createdAt: true,
          },
        },
        // Listener sessions (for online streaming if available)
        listenerSessions: {
          select: {
            durationSeconds: true,
            startedAt: true,
            endedAt: true,
          },
        },
      },
    })

    const totalPrograms = programs.length
    const activePrograms = programs.filter((p) => p.isActive).length

    // Calculate REAL engagement metrics for FM radio
    // Total listener engagement = requests + sessions (online streaming)
    const totalEngagement = programs.reduce((sum, p) => {
      return sum + p.listenerRequests.length + p.listenerSessions.length
    }, 0)

    // Calculate average rating from REAL data
    const allRatings = programs.flatMap((p) => p.ratings)
    const averageRating =
      allRatings.length > 0
        ? parseFloat((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(1))
        : 0

    // Calculate engagement retention (how many repeat interactions)
    // For FM: Calculate from listener requests over time
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentRequests = programs.flatMap((p) =>
      p.listenerRequests.filter((r) => r.createdAt >= thirtyDaysAgo)
    )
    const totalRequests = programs.flatMap((p) => p.listenerRequests)

    // Engagement retention = % of requests in last 30 days vs all time
    const engagementRetention =
      totalRequests.length > 0
        ? parseFloat(((recentRequests.length / totalRequests.length) * 100).toFixed(1))
        : 0

    // Calculate monthly growth
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const currentMonthStart = new Date(currentYear, currentMonth, 1)
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
    const lastMonthStart = new Date(lastMonthYear, lastMonth, 1)
    const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59)

    const currentMonthEngagement = programs.reduce((sum, p) => {
      const requests = p.listenerRequests.filter(
        (r) => r.createdAt >= currentMonthStart && r.createdAt <= currentMonthEnd
      )
      const sessions = p.listenerSessions.filter(
        (s) => s.startedAt >= currentMonthStart && s.startedAt <= currentMonthEnd
      )
      return sum + requests.length + sessions.length
    }, 0)

    const lastMonthEngagement = programs.reduce((sum, p) => {
      const requests = p.listenerRequests.filter(
        (r) => r.createdAt >= lastMonthStart && r.createdAt <= lastMonthEnd
      )
      const sessions = p.listenerSessions.filter(
        (s) => s.startedAt >= lastMonthStart && s.startedAt <= lastMonthEnd
      )
      return sum + requests.length + sessions.length
    }, 0)

    const monthlyGrowth =
      lastMonthEngagement > 0
        ? parseFloat((((currentMonthEngagement - lastMonthEngagement) / lastMonthEngagement) * 100).toFixed(1))
        : 0

    // Find peak engagement hour from listener requests and schedules
    const hourCounts: Record<number, number> = {}

    // Count from scheduled times
    programs.forEach((program) => {
      program.schedules.forEach((schedule) => {
        const hour = parseInt(schedule.startTime.split(':')[0])
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      })
    })

    // Add weight from actual listener requests
    programs.forEach((program) => {
      program.listenerRequests.forEach((request) => {
        const hour = request.createdAt.getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 2 // Weight requests higher
      })
    })

    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]
    const peakHourFormatted = peakHour
      ? `${peakHour[0]}:00 ${parseInt(peakHour[0]) < 12 ? 'AM' : 'PM'}`
      : 'N/A'

    // Program performance (top 5) with REAL FM engagement data
    const programPerformance = programs
      .filter((p) => p.isActive)
      .map((program) => {
        // Calculate engagement score
        const listeners = program.listenerRequests.length + program.listenerSessions.length

        // Calculate real rating
        const programRatings = program.ratings
        const rating =
          programRatings.length > 0
            ? parseFloat((programRatings.reduce((sum, r) => sum + r.rating, 0) / programRatings.length).toFixed(1))
            : 0

        // Calculate engagement retention for this program
        const programRecentRequests = program.listenerRequests.filter((r) => r.createdAt >= thirtyDaysAgo)
        const retention =
          program.listenerRequests.length > 0
            ? Math.round((programRecentRequests.length / program.listenerRequests.length) * 100)
            : 0

        return {
          name: program.name,
          host: program.host?.name || 'Unknown',
          listeners, // Actually engagement score
          rating,
          retention,
          genre: program.genre || 'General',
        }
      })
      .sort((a, b) => b.listeners - a.listeners)
      .slice(0, 5)

    // Hourly engagement pattern from REAL listener requests
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)

    const recentInteractions = programs.flatMap((p) =>
      p.listenerRequests.filter((r) => r.createdAt >= last7Days)
    )

    // Group by hour brackets
    const hourlyMap: Record<string, number> = {
      '6am': 0,
      '7am': 0,
      '8am': 0,
      '9am': 0,
      '12pm': 0,
      '3pm': 0,
      '6pm': 0,
      '9pm': 0,
    }

    recentInteractions.forEach((request) => {
      const hour = request.createdAt.getHours()
      if (hour >= 6 && hour < 7) hourlyMap['6am']++
      else if (hour >= 7 && hour < 8) hourlyMap['7am']++
      else if (hour >= 8 && hour < 9) hourlyMap['8am']++
      else if (hour >= 9 && hour < 12) hourlyMap['9am']++
      else if (hour >= 12 && hour < 15) hourlyMap['12pm']++
      else if (hour >= 15 && hour < 18) hourlyMap['3pm']++
      else if (hour >= 18 && hour < 21) hourlyMap['6pm']++
      else if (hour >= 21 || hour < 6) hourlyMap['9pm']++
    })

    const hourlyData = Object.entries(hourlyMap).map(([hour, listeners]) => ({
      hour,
      listeners, // Actually engagement count
    }))

    // Genre distribution with engagement
    const genreCount: Record<string, { programs: number; listeners: number }> = {}
    programs.forEach((program) => {
      const genre = program.genre || 'Other'
      if (!genreCount[genre]) {
        genreCount[genre] = { programs: 0, listeners: 0 }
      }
      genreCount[genre].programs++
      // Count total engagement for this program
      genreCount[genre].listeners += program.listenerRequests.length + program.listenerSessions.length
    })

    const totalGenrePrograms = Object.values(genreCount).reduce((sum, g) => sum + g.programs, 0)
    const genreDistribution = Object.entries(genreCount)
      .map(([genre, data]) => ({
        genre,
        programs: data.programs,
        percentage: totalGenrePrograms > 0 ? Math.round((data.programs / totalGenrePrograms) * 100) : 0,
        listeners: data.listeners, // Actually total engagement
      }))
      .sort((a, b) => b.programs - a.programs)
      .slice(0, 5)

    return NextResponse.json({
      metrics: {
        totalPrograms,
        activePrograms,
        totalListeners: totalEngagement, // Actually total engagement
        averageRating,
        peakListeningHour: peakHourFormatted,
        averageRetention: engagementRetention,
        monthlyGrowth,
      },
      programPerformance,
      hourlyData,
      genreDistribution,
    })
  } catch (error) {
    console.error('Error fetching program analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch program analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
