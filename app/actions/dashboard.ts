'use server'

/**
 * Dashboard Server Actions
 * Handles data fetching for dashboard with proper error handling and data formatting
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Types for dashboard data
export interface ActivityItem {
  id: string
  title: string
  description: string
  resource: string
  action: string
  resourceId?: string | null
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  timestamp: Date
  icon: string
  color: string
}

export interface ActivityResponse {
  data: ActivityItem[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface MetricsData {
  growthRate: {
    value: number
    label: string
    unit: string
    trend: number
    description: string
  }
  clients: {
    total: number
    active: number
    percentage: number
  }
  programs: {
    total: number
    active: number
    percentage: number
  }
  campaigns: {
    total: number
    sent: number
    percentage: number
  }
}

export interface MetricsResponse {
  data: MetricsData
  timestamp: Date
}

export interface DashboardStats {
  clients: { total: number; active: number }
  programs: { total: number; active: number }
  campaigns: { total: number; sent: number }
}

/**
 * Fetch recent activity logs
 * @param limit Number of records to fetch (max 50)
 * @param offset Pagination offset
 * @returns ActivityResponse with formatted activity data
 */
export async function fetchDashboardActivity(
  limit: number = 5,
  offset: number = 0
): Promise<ActivityResponse> {
  try {
    const session = await auth()

    if (!session || !session.user?.email) {
      throw new Error('Unauthorized')
    }

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user || !user.organizationId) {
      throw new Error('User or organization not found')
    }

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
      take: Math.min(limit, 50),
      skip: offset
    })

    // Get total count
    const total = await prisma.activityLog.count({
      where: {
        organizationId: user.organizationId
      }
    })

    // Format activity data for readability
    const formattedActivities: ActivityItem[] = activities.map((activity) => ({
      id: activity.id,
      title: getActivityTitle(activity.action, activity.resource),
      description: activity.description,
      resource: activity.resource,
      action: activity.action,
      resourceId: activity.resourceId || undefined,
      user: activity.user,
      timestamp: activity.createdAt,
      icon: getActivityIcon(activity.resource),
      color: getActivityColor(activity.action)
    }))

    return {
      data: formattedActivities,
      pagination: {
        total,
        limit: Math.min(limit, 50),
        offset,
        hasMore: offset + Math.min(limit, 50) < total
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard activity:', error)
    throw new Error('Failed to fetch activity data')
  }
}

/**
 * Fetch metrics data (growth rate and stats)
 * @returns MetricsResponse with formatted metrics
 */
export async function fetchDashboardMetrics(): Promise<MetricsResponse> {
  try {
    const session = await auth()

    if (!session || !session.user?.email) {
      throw new Error('Unauthorized')
    }

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user || !user.organizationId) {
      throw new Error('User or organization not found')
    }

    // Get current counts
    const [clientsTotal, clientsActive, programsTotal, programsActive, campaignsTotal, campaignsSent] = await Promise.all([
      prisma.client.count({
        where: { organizationId: user.organizationId }
      }),
      prisma.client.count({
        where: { organizationId: user.organizationId, status: 'ACTIVE' }
      }),
      prisma.program.count({
        where: { organizationId: user.organizationId }
      }),
      prisma.program.count({
        where: { organizationId: user.organizationId, isActive: true }
      }),
      prisma.sMSCampaign.count({
        where: { organizationId: user.organizationId }
      }),
      prisma.sMSCampaign.count({
        where: { organizationId: user.organizationId, status: 'SENT' }
      })
    ])

    // Calculate growth rate (compare with previous month)
    const today = new Date()
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
    const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, today.getDate())

    // Get client counts from last month
    const clientsLastMonth = await prisma.client.count({
      where: {
        organizationId: user.organizationId,
        createdAt: {
          lte: oneMonthAgo
        }
      }
    })

    const clientsTwoMonthsAgo = await prisma.client.count({
      where: {
        organizationId: user.organizationId,
        createdAt: {
          lte: twoMonthsAgo
        }
      }
    })

    // Calculate growth percentage
    let growthRate = 0
    let growthTrend = 0

    if (clientsLastMonth > 0) {
      growthRate = ((clientsTotal - clientsLastMonth) / clientsLastMonth) * 100
    }

    if (clientsTwoMonthsAgo > 0) {
      growthTrend = ((clientsLastMonth - clientsTwoMonthsAgo) / clientsTwoMonthsAgo) * 100
    }

    // Format metrics
    const metrics: MetricsData = {
      growthRate: {
        value: Math.round(growthRate * 10) / 10,
        label: 'Growth Rate',
        unit: '%',
        trend: Math.round(growthTrend * 10) / 10,
        description: `${growthRate > 0 ? '+' : ''}${Math.round(growthRate)}% from last month`
      },
      clients: {
        total: clientsTotal,
        active: clientsActive,
        percentage: clientsTotal > 0 ? Math.round((clientsActive / clientsTotal) * 100) : 0
      },
      programs: {
        total: programsTotal,
        active: programsActive,
        percentage: programsTotal > 0 ? Math.round((programsActive / programsTotal) * 100) : 0
      },
      campaigns: {
        total: campaignsTotal,
        sent: campaignsSent,
        percentage: campaignsTotal > 0 ? Math.round((campaignsSent / campaignsTotal) * 100) : 0
      }
    }

    return {
      data: metrics,
      timestamp: new Date()
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    throw new Error('Failed to fetch metrics data')
  }
}

/**
 * Fetch dashboard stats (clients, programs, campaigns counts)
 * @returns DashboardStats with real data
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const session = await auth()

    if (!session || !session.user?.email) {
      throw new Error('Unauthorized')
    }

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user || !user.organizationId) {
      throw new Error('User or organization not found')
    }

    // Get counts in parallel
    const [clientsTotal, clientsActive, programsTotal, programsActive, campaignsTotal, campaignsSent] = await Promise.all([
      prisma.client.count({
        where: { organizationId: user.organizationId }
      }),
      prisma.client.count({
        where: { organizationId: user.organizationId, status: 'ACTIVE' }
      }),
      prisma.program.count({
        where: { organizationId: user.organizationId }
      }),
      prisma.program.count({
        where: { organizationId: user.organizationId, isActive: true }
      }),
      prisma.sMSCampaign.count({
        where: { organizationId: user.organizationId }
      }),
      prisma.sMSCampaign.count({
        where: { organizationId: user.organizationId, status: 'SENT' }
      })
    ])

    return {
      clients: {
        total: clientsTotal,
        active: clientsActive
      },
      programs: {
        total: programsTotal,
        active: programsActive
      },
      campaigns: {
        total: campaignsTotal,
        sent: campaignsSent
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw new Error('Failed to fetch stats data')
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

