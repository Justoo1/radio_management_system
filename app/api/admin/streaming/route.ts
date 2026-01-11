/**
 * Admin API: Streaming Management
 * Manage AzuraCast server and organization streaming configs
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getAzuraCastService } from '@/lib/services/azuracast.service'

// GET /api/admin/streaming - Get streaming overview
export async function GET() {
  try {
    // Check for developer access cookie
    const cookieStore = await cookies()
    const devAccessToken = cookieStore.get('dev_access_token')

    if (!devAccessToken || !devAccessToken.value) {
      return NextResponse.json({ error: 'Unauthorized - Developer access required' }, { status: 401 })
    }

    // Get all streaming configs with organization info
    const streamingConfigs = await prisma.streamingConfig.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
        _count: {
          select: {
            mountPoints: true,
            djAccounts: true,
            playlists: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get organizations without streaming configs (for linking)
    const orgsWithoutStreaming = await prisma.organization.findMany({
      where: {
        streamingConfig: null,
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
      orderBy: { name: 'asc' },
    })

    // Get AzuraCast server status
    let azuracastStatus = {
      online: false,
      url: process.env.AZURACAST_URL || 'Not configured',
      stations: [] as Array<{ id: number; name: string; is_online: boolean; listeners: number; linkedOrgId: string | null }>,
    }

    try {
      const azuracast = getAzuraCastService()
      const isOnline = await azuracast.healthCheck()
      azuracastStatus.online = isOnline

      if (isOnline) {
        const stations = await azuracast.getStations()

        // Check which stations are linked to organizations
        const linkedConfigs = await prisma.streamingConfig.findMany({
          where: {
            azuracastStationId: { in: stations.map(s => s.id) }
          },
          select: {
            azuracastStationId: true,
            organizationId: true,
          }
        })
        const linkedMap = new Map(linkedConfigs.map(c => [c.azuracastStationId, c.organizationId]))

        azuracastStatus.stations = stations.map((s) => ({
          id: s.id,
          name: s.name,
          is_online: true, // Would need now_playing endpoint for accurate status
          listeners: 0,
          linkedOrgId: linkedMap.get(s.id) || null,
        }))

        // Get listener counts from now playing
        for (const station of stations) {
          try {
            const nowPlaying = await azuracast.getNowPlaying(station.id)
            const stationData = azuracastStatus.stations.find((s) => s.id === station.id)
            if (stationData && nowPlaying) {
              stationData.is_online = nowPlaying.is_online
              stationData.listeners = nowPlaying.listeners?.current || 0
            }
          } catch {
            // Station might not have now playing data
          }
        }
      }
    } catch (err) {
      console.error('Failed to get AzuraCast status:', err)
    }

    // Calculate stats
    const stats = {
      totalConfigs: streamingConfigs.length,
      activeStreams: streamingConfigs.filter((c) => c.status === 'ACTIVE').length,
      totalListeners: azuracastStatus.stations.reduce((sum, s) => sum + s.listeners, 0),
      totalMountPoints: streamingConfigs.reduce((sum, c) => sum + c._count.mountPoints, 0),
      totalDJAccounts: streamingConfigs.reduce((sum, c) => sum + c._count.djAccounts, 0),
      totalPlaylists: streamingConfigs.reduce((sum, c) => sum + c._count.playlists, 0),
    }

    return NextResponse.json({
      stats,
      azuracast: azuracastStatus,
      configs: streamingConfigs,
      availableOrganizations: orgsWithoutStreaming,
    })
  } catch (error) {
    console.error('Error fetching streaming data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch streaming data' },
      { status: 500 }
    )
  }
}

// Helper to check if AzuraCast is configured
function isAzuraCastConfigured(): boolean {
  return Boolean(process.env.AZURACAST_URL && process.env.AZURACAST_API_KEY)
}

// POST /api/admin/streaming - Admin actions (sync, restart, etc.)
export async function POST(request: NextRequest) {
  try {
    // Check for developer access cookie
    const cookieStore = await cookies()
    const devAccessToken = cookieStore.get('dev_access_token')

    if (!devAccessToken || !devAccessToken.value) {
      return NextResponse.json({ error: 'Unauthorized - Developer access required' }, { status: 401 })
    }

    const body = await request.json()
    const { action, organizationId, stationId } = body

    // Actions that require AzuraCast connection
    const azuracastRequiredActions = ['sync_stations', 'restart_station', 'provision_station', 'link_station']

    if (azuracastRequiredActions.includes(action) && !isAzuraCastConfigured()) {
      return NextResponse.json(
        {
          error: 'AzuraCast not configured',
          details: 'Please set AZURACAST_URL and AZURACAST_API_KEY environment variables'
        },
        { status: 503 }
      )
    }

    switch (action) {
      case 'sync_stations': {
        // Sync all stations from AzuraCast to database
        const azuracast = getAzuraCastService()
        const stations = await azuracast.getStations()
        const syncResults = []

        for (const station of stations) {
          // Find matching config by station ID
          const config = await prisma.streamingConfig.findFirst({
            where: { azuracastStationId: station.id },
          })

          if (config) {
            // Update existing config
            await prisma.streamingConfig.update({
              where: { id: config.id },
              data: {
                streamUrl: station.listen_url,
                streamName: station.name,
              },
            })
            syncResults.push({ stationId: station.id, action: 'updated', name: station.name })
          } else {
            syncResults.push({ stationId: station.id, action: 'unlinked', name: station.name })
          }
        }

        return NextResponse.json({ success: true, results: syncResults })
      }

      case 'restart_station': {
        if (!stationId) {
          return NextResponse.json({ error: 'Station ID required' }, { status: 400 })
        }

        const azuracast = getAzuraCastService()
        await azuracast.stopStation(stationId)
        await new Promise((resolve) => setTimeout(resolve, 2000))
        await azuracast.startStation(stationId)

        return NextResponse.json({ success: true, message: 'Station restarted' })
      }

      case 'enable_streaming': {
        if (!organizationId) {
          return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
        }

        // Enable streaming feature for organization
        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
        })

        if (!org) {
          return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        let enabledFeatures: string[] = []
        try {
          enabledFeatures = org.enabledFeatures ? JSON.parse(org.enabledFeatures) : []
        } catch {
          enabledFeatures = []
        }

        if (!enabledFeatures.includes('streaming')) {
          enabledFeatures.push('streaming')
          await prisma.organization.update({
            where: { id: organizationId },
            data: { enabledFeatures: JSON.stringify(enabledFeatures) },
          })
        }

        return NextResponse.json({ success: true, message: 'Streaming enabled for organization' })
      }

      case 'disable_streaming': {
        if (!organizationId) {
          return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
        }

        // Disable streaming feature for organization
        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
        })

        if (!org) {
          return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        let enabledFeatures: string[] = []
        try {
          enabledFeatures = org.enabledFeatures ? JSON.parse(org.enabledFeatures) : []
        } catch {
          enabledFeatures = []
        }

        enabledFeatures = enabledFeatures.filter((f) => f !== 'streaming')
        await prisma.organization.update({
          where: { id: organizationId },
          data: { enabledFeatures: JSON.stringify(enabledFeatures) },
        })

        return NextResponse.json({ success: true, message: 'Streaming disabled for organization' })
      }

      case 'provision_station': {
        if (!organizationId) {
          return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
        }

        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
          include: { streamingConfig: true },
        })

        if (!org) {
          return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        if (org.streamingConfig) {
          return NextResponse.json({ error: 'Organization already has a streaming config' }, { status: 400 })
        }

        // Create station in AzuraCast
        const azuracast = getAzuraCastService()
        const station = await azuracast.createStation({
          name: org.name,
          short_name: org.slug || org.name.toLowerCase().replace(/\s+/g, '-'),
          description: `Radio station for ${org.name}`,
          timezone: 'Africa/Accra',
          enable_requests: true,
        })

        // Create streaming config
        const config = await prisma.streamingConfig.create({
          data: {
            organizationId: org.id,
            azuracastStationId: station.id,
            streamName: org.name,
            streamUrl: station.listen_url,
            isEnabled: true,
            status: 'ACTIVE',
          },
        })

        return NextResponse.json({ success: true, config, station })
      }

      case 'link_station': {
        // Link an existing AzuraCast station to an organization
        if (!organizationId) {
          return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
        }
        if (!stationId) {
          return NextResponse.json({ error: 'Station ID required' }, { status: 400 })
        }

        // Check if organization exists and doesn't have a streaming config
        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
          include: { streamingConfig: true },
        })

        if (!org) {
          return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        if (org.streamingConfig) {
          return NextResponse.json({ error: 'Organization already has a streaming config' }, { status: 400 })
        }

        // Check if station is already linked to another organization
        const existingConfig = await prisma.streamingConfig.findFirst({
          where: { azuracastStationId: stationId },
          include: { organization: { select: { name: true } } },
        })

        if (existingConfig) {
          return NextResponse.json({
            error: `Station already linked to ${existingConfig.organization.name}`
          }, { status: 400 })
        }

        // Get station details from AzuraCast
        const azuracast = getAzuraCastService()
        const station = await azuracast.getStation(stationId)

        if (!station) {
          return NextResponse.json({ error: 'Station not found in AzuraCast' }, { status: 404 })
        }

        // Create streaming config linking org to station
        const config = await prisma.streamingConfig.create({
          data: {
            organizationId: org.id,
            azuracastStationId: station.id,
            streamName: station.name,
            streamUrl: station.listen_url || null,
            isEnabled: true,
            status: 'ACTIVE',
          },
        })

        // Enable streaming feature for the organization
        let enabledFeatures: string[] = []
        try {
          enabledFeatures = org.enabledFeatures ? JSON.parse(org.enabledFeatures) : []
        } catch {
          enabledFeatures = []
        }

        if (!enabledFeatures.includes('streaming')) {
          enabledFeatures.push('streaming')
          await prisma.organization.update({
            where: { id: organizationId },
            data: { enabledFeatures: JSON.stringify(enabledFeatures) },
          })
        }

        return NextResponse.json({
          success: true,
          message: `Station "${station.name}" linked to ${org.name}`,
          config,
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin streaming action failed:', error)
    return NextResponse.json(
      { error: 'Action failed' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
