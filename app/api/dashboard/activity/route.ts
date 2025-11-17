/**
 * Dashboard Activity API
 * Fetches recent activity logs
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'User or organization not found' },
        { status: 404 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch activity logs
    const activities = await prisma.activityLog.findMany({
      where: {
        organizationId: user.organizationId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Get total count
    const total = await prisma.activityLog.count({
      where: {
        organizationId: user.organizationId
      }
    })

    // Format activity data for readability
    const formattedActivities = activities.map((activity) => ({
      id: activity.id,
      title: getActivityTitle(activity.action, activity.resource),
      description: activity.description,
      resource: activity.resource,
      action: activity.action,
      resourceId: activity.resourceId,
      user: activity.user,
      timestamp: activity.createdAt,
      icon: getActivityIcon(activity.resource),
      color: getActivityColor(activity.action)
    }))

    return NextResponse.json({
      data: formattedActivities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Failed to fetch activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}

// Helper function to generate activity title
function getActivityTitle(action: string, resource: string): string {
  const titles: Record<string, Record<string, string>> = {
    CREATE: {
      Client: 'New client added',
      Program: 'Program created',
      SMSCampaign: 'SMS campaign created',
      Contract: 'Contract created',
      Invoice: 'Invoice created'
    },
    UPDATE: {
      Client: 'Client updated',
      Program: 'Program updated',
      SMSCampaign: 'Campaign updated',
      Contract: 'Contract updated',
      Invoice: 'Invoice updated'
    },
    DELETE: {
      Client: 'Client deleted',
      Program: 'Program deleted',
      SMSCampaign: 'Campaign deleted',
      Contract: 'Contract deleted',
      Invoice: 'Invoice deleted'
    },
    SEND: {
      SMSCampaign: 'SMS campaign sent'
    },
    SCHEDULE: {
      Program: 'Program scheduled',
      SMSCampaign: 'Campaign scheduled'
    }
  }

  return titles[action]?.[resource] || `${action} ${resource}`
}

// Helper function to get activity icon based on resource
function getActivityIcon(resource: string): string {
  const icons: Record<string, string> = {
    Client: 'users',
    Program: 'radio',
    SMSCampaign: 'message-square',
    Contract: 'file-text',
    Invoice: 'file-check',
    User: 'user',
    Organization: 'building'
  }
  return icons[resource] || 'activity'
}

// Helper function to get color based on action
function getActivityColor(action: string): string {
  const colors: Record<string, string> = {
    CREATE: 'blue',
    UPDATE: 'purple',
    DELETE: 'red',
    SEND: 'emerald',
    SCHEDULE: 'orange'
  }
  return colors[action] || 'slate'
}
