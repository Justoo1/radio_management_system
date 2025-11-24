/**
 * Team Members API Endpoints
 * GET /api/teams/[id]/members - List team members
 * POST /api/teams/[id]/members - Add member to team
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/teams/[id]/members
 * List all members of a team
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify team belongs to organization
    const team = await prisma.team.findUnique({
      where: { id },
      select: { organizationId: true },
    })

    if (!team || team.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Get team members
    const members = await prisma.teamMember.findMany({
      where: { teamId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    return NextResponse.json({
      data: members,
      total: members.length,
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teams/[id]/members
 * Add a member to team (Admin/Team Lead only)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get team and check ownership
    const team = await prisma.team.findUnique({
      where: { id },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    if (team.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check permissions - only admin or team lead can add members
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    })

    const isAdmin = user?.role.name === 'OWNER' || user?.role.name === 'ADMIN'
    const isTeamLead = team.teamLeadId === session.user.id

    if (!isAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: 'Only admins or team leads can add members' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { userId, role = 'MEMBER', title, bio } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify user exists in organization
    const memberUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: session.user.organizationId,
      },
    })

    if (!memberUser) {
      return NextResponse.json(
        { error: 'User not found in organization' },
        { status: 400 }
      )
    }

    // Check if user is already a team member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 400 }
      )
    }

    // Create team member
    const member = await prisma.teamMember.create({
      data: {
        teamId: id,
        userId,
        role,
        title: title?.trim() || null,
        bio: bio?.trim() || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding team member:', error)
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    )
  }
}
