/**
 * Team Detail API Endpoints
 * GET /api/teams/[id] - Get team details
 * PATCH /api/teams/[id] - Update team
 * DELETE /api/teams/[id] - Delete team
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/teams/[id]
 * Get team details with members and programs
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
      include: {
        teamLead: {
          select: { id: true, name: true, email: true, image: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        programs: {
          select: { id: true, name: true, isActive: true },
        },
      },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Verify team belongs to user's organization
    if (team.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/teams/[id]
 * Update team details (Admin/Team Lead only)
 */
export async function PATCH(
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

    // Check permissions - only admin or team lead can edit
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    })

    const isAdmin = user?.role.name === 'OWNER' || user?.role.name === 'ADMIN'
    const isTeamLead = team.teamLeadId === session.user.id

    if (!isAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: 'Only admins or team leads can update teams' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, description, teamType, teamLeadId, status, isActive } = body

    // Build update data
    const updateData: any = {}

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: 'Team name cannot be empty' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (teamType !== undefined) {
      updateData.teamType = teamType
    }

    if (teamLeadId !== undefined) {
      if (teamLeadId) {
        // Verify team lead exists in organization
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
      updateData.teamLeadId = teamLeadId || null
    }

    if (status !== undefined) {
      updateData.status = status
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        teamLead: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/teams/[id]
 * Delete a team (Admin only)
 */
export async function DELETE(
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

    // Get team
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    })

    const isAdmin = user?.role.name === 'OWNER' || user?.role.name === 'ADMIN'
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can delete teams' },
        { status: 403 }
      )
    }

    // Delete team (cascade will handle members)
    await prisma.team.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    )
  }
}
