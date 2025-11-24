/**
 * Teams API Endpoints
 * GET /api/teams - List all teams
 * POST /api/teams - Create new team
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/teams
 * List all teams in the organization
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const teamType = searchParams.get('teamType')
    const status = searchParams.get('status')

    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (teamType && teamType !== 'ALL') {
      where.teamType = teamType
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    // Get total count
    const total = await prisma.team.count({ where })

    // Fetch teams with members and created by info
    const teams = await prisma.team.findMany({
      where,
      include: {
        teamLead: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: { id: true, userId: true, role: true },
        },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      data: teams,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teams
 * Create a new team (Only OWNER/ADMIN)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is OWNER or ADMIN (can create teams)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    })

    const isAdmin = user?.role.name === 'OWNER' || user?.role.name === 'ADMIN'
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can create teams' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, description, teamType, teamLeadId } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    if (!teamType) {
      return NextResponse.json(
        { error: 'Team type is required' },
        { status: 400 }
      )
    }

    // Check if team name already exists
    const existingTeam = await prisma.team.findUnique({
      where: {
        name_organizationId: {
          name: name.trim(),
          organizationId: session.user.organizationId,
        },
      },
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: 'A team with this name already exists' },
        { status: 400 }
      )
    }

    // If teamLeadId provided, verify the user exists and belongs to organization
    if (teamLeadId) {
      const teamLead = await prisma.user.findFirst({
        where: {
          id: teamLeadId,
          organizationId: session.user.organizationId,
        },
      })

      if (!teamLead) {
        return NextResponse.json(
          { error: 'Team lead not found' },
          { status: 400 }
        )
      }
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        teamType,
        organizationId: session.user.organizationId,
        createdById: session.user.id,
        teamLeadId: teamLeadId || null,
      },
      include: {
        teamLead: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        members: true,
      },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
