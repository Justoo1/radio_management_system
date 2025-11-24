/**
 * Team Member Detail API Endpoints
 * GET /api/teams/[id]/members/[memberId] - Get member details
 * PATCH /api/teams/[id]/members/[memberId] - Update member
 * DELETE /api/teams/[id]/members/[memberId] - Remove member
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/teams/[id]/members/[memberId]
 * Get team member details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth()
    const { id, memberId } = await params

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

    // Get team member
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
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
    })

    if (!member || member.teamId !== id) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error fetching team member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team member' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/teams/[id]/members/[memberId]
 * Update team member role/details (Admin/Team Lead only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth()
    const { id, memberId } = await params

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify team belongs to organization
    const team = await prisma.team.findUnique({
      where: { id },
    })

    if (!team || team.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    })

    const isAdmin = user?.role.name === 'OWNER' || user?.role.name === 'ADMIN'
    const isTeamLead = team.teamLeadId === session.user.id

    if (!isAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: 'Only admins or team leads can update members' },
        { status: 403 }
      )
    }

    // Get member
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
    })

    if (!member || member.teamId !== id) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { role, title, bio, isActive } = body

    // Build update data
    const updateData: any = {}

    if (role !== undefined) {
      updateData.role = role
    }

    if (title !== undefined) {
      updateData.title = title?.trim() || null
    }

    if (bio !== undefined) {
      updateData.bio = bio?.trim() || null
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    // Update member
    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: updateData,
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

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/teams/[id]/members/[memberId]
 * Remove member from team (Admin/Team Lead only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth()
    const { id, memberId } = await params

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify team belongs to organization
    const team = await prisma.team.findUnique({
      where: { id },
    })

    if (!team || team.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    })

    const isAdmin = user?.role.name === 'OWNER' || user?.role.name === 'ADMIN'
    const isTeamLead = team.teamLeadId === session.user.id

    if (!isAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: 'Only admins or team leads can remove members' },
        { status: 403 }
      )
    }

    // Get member
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
    })

    if (!member || member.teamId !== id) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Delete member
    await prisma.teamMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing team member:', error)
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    )
  }
}
