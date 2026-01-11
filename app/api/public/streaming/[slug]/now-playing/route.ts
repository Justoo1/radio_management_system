/**
 * Public API: Now Playing
 * Returns current song and listener info for a station
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAzuraCastService } from '@/lib/services/azuracast.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Get organization and streaming config
    const organization = await prisma.organization.findFirst({
      where: { slug },
      include: {
        streamingConfig: true,
      },
    })

    if (!organization?.streamingConfig?.azuracastStationId) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 })
    }

    // Check if AzuraCast is configured
    if (!process.env.AZURACAST_URL || !process.env.AZURACAST_API_KEY) {
      return NextResponse.json({
        song: null,
        listeners: { current: 0 },
        is_online: false,
      })
    }

    // Get now playing from AzuraCast
    const azuracast = getAzuraCastService()
    const nowPlaying = await azuracast.getNowPlaying(organization.streamingConfig.azuracastStationId)

    return NextResponse.json({
      song: nowPlaying?.now_playing?.song ? {
        title: nowPlaying.now_playing.song.title,
        artist: nowPlaying.now_playing.song.artist,
        art: nowPlaying.now_playing.song.art,
      } : null,
      listeners: {
        current: nowPlaying?.listeners?.current || 0,
        unique: nowPlaying?.listeners?.unique || 0,
        total: nowPlaying?.listeners?.total || 0,
      },
      is_online: nowPlaying?.is_online ?? false,
    })
  } catch (error) {
    console.error('Error fetching now playing:', error)
    return NextResponse.json({
      song: null,
      listeners: { current: 0 },
      is_online: false,
    })
  }
}

export const dynamic = 'force-dynamic'
