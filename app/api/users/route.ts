/**
 * Users API Endpoints
 * GET /api/users - Fetch users with optional filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/users
 * Fetch users for the organization
 * Query params:
 *   - role: Filter by role (e.g., PRESENTER, ADMIN, STAFF)
 *   - search: Search by name or email
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
    const roleFilter = searchParams.get('role')
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    }

    // Filter by role if specified
    if (roleFilter) {
      // Handle role filtering - check if it's looking for users with specific role name
      where.role = {
        name: {
          contains: roleFilter,
          mode: 'insensitive',
        },
      }
    }

    // Search by name or email if specified
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      data: users,
      total: users.length,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
