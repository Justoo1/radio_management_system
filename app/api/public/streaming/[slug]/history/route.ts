import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createAzuraCastService } from '@/lib/services/azuracast.service'

// GET /api/public/streaming/[slug]/history - Get recently played tracks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Find organization by slug
    const organization = await prisma.organization.findFirst({
      where: { slug },
      include: {
        streamingConfig: true,
      },
    })

    if (!organization?.streamingConfig) {
      return NextResponse.json(
        { error: 'Streaming not configured for this station' },
        { status: 404 }
      )
    }

    const config = organization.streamingConfig

    // If connected to AzuraCast, try to get history from there
    if (config.azuracastStationId) {
      try {
        const azuracastService = createAzuraCastService()
        const historyData = await azuracastService.getStationHistory(
          config.azuracastStationId,
          10
        )

        // Transform AzuraCast history format
        const history = historyData.map((item: any) => ({
          title: item.song?.title || 'Unknown Track',
          artist: item.song?.artist || 'Unknown Artist',
          art: item.song?.art || null,
          playedAt: item.played_at ? new Date(item.played_at * 1000).toISOString() : new Date().toISOString(),
        }))

        return NextResponse.json({ history })
      } catch (azuraError) {
        console.error('AzuraCast history fetch failed:', azuraError)
      }
    }

    // Fallback: Get history from local database
    const localHistory = await prisma.streamNowPlayingHistory.findMany({
      where: {
        streamingConfigId: config.id,
      },
      orderBy: {
        playedAt: 'desc',
      },
      take: 10,
    })

    const history = localHistory.map((item) => ({
      title: item.title,
      artist: item.artist,
      art: item.artworkUrl,
      playedAt: item.playedAt.toISOString(),
    }))

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error fetching track history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch track history' },
      { status: 500 }
    )
  }
}
