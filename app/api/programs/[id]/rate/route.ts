/**
 * Program Rating API
 * Allows listeners to rate programs
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Submit a rating for a program
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: programId } = await context.params
    const body = await request.json()
    const { rating, review, listenerName, listenerEmail } = body

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Get program details
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { organizationId: true },
    })

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Get IP address for duplicate prevention
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

    // Check for duplicate rating from same IP in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const existingRating = await prisma.programRating.findFirst({
      where: {
        programId,
        ipAddress,
        createdAt: { gte: oneDayAgo },
      },
    })

    if (existingRating) {
      return NextResponse.json(
        { error: 'You have already rated this program in the last 24 hours' },
        { status: 429 }
      )
    }

    // Create rating
    const newRating = await prisma.programRating.create({
      data: {
        organizationId: program.organizationId,
        programId,
        rating: Math.floor(rating),
        review: review || null,
        listenerName: listenerName || null,
        listenerEmail: listenerEmail || null,
        ipAddress,
      },
    })

    return NextResponse.json({
      success: true,
      ratingId: newRating.id,
      message: 'Thank you for your rating!',
    })
  } catch (error) {
    console.error('Error submitting rating:', error)
    return NextResponse.json(
      { error: 'Failed to submit rating', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Get ratings for a program
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: programId } = await context.params

    // Get all ratings
    const ratings = await prisma.programRating.findMany({
      where: { programId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Last 50 ratings
    })

    if (ratings.length === 0) {
      return NextResponse.json({
        averageRating: 0,
        totalRatings: 0,
        ratings: [],
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      })
    }

    // Calculate statistics
    const totalRatings = ratings.length
    const sumRatings = ratings.reduce((sum, r) => sum + r.rating, 0)
    const averageRating = parseFloat((sumRatings / totalRatings).toFixed(1))

    // Calculate distribution
    const distribution = ratings.reduce(
      (acc, r) => {
        acc[r.rating as 1 | 2 | 3 | 4 | 5] = (acc[r.rating as 1 | 2 | 3 | 4 | 5] || 0) + 1
        return acc
      },
      { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>
    )

    return NextResponse.json({
      averageRating,
      totalRatings,
      distribution,
      ratings: ratings.map((r) => ({
        rating: r.rating,
        review: r.review,
        listenerName: r.listenerName,
        createdAt: r.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ratings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
