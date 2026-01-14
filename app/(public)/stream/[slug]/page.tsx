/**
 * Public Streaming Player Page
 * Allows listeners to tune in to a radio station's stream
 */

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import PublicStreamPlayer from './PublicStreamPlayer'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params

  const organization = await prisma.organization.findFirst({
    where: { slug },
    include: {
      streamingConfig: true,
    },
  })

  if (!organization?.streamingConfig) {
    return { title: 'Station Not Found' }
  }

  return {
    title: `${organization.streamingConfig.streamName || organization.name} - Live Stream`,
    description: organization.streamingConfig.streamDescription || `Listen to ${organization.name} live online`,
  }
}

export default async function PublicStreamPage({ params }: Props) {
  const { slug } = await params

  const organization = await prisma.organization.findFirst({
    where: { slug },
    include: {
      streamingConfig: {
        include: {
          mountPoints: {
            where: { isDefault: true },
            take: 1,
          },
        },
      },
    },
  })

  if (!organization?.streamingConfig) {
    notFound()
  }

  const config = organization.streamingConfig
  const defaultMount = config.mountPoints[0]

  // Build the stream URL - fetch fresh from AzuraCast if available
  let streamUrl = config.streamUrl

  // If we have AzuraCast station ID, fetch the current stream URL
  if (config.azuracastStationId) {
    try {
      const { createAzuraCastService } = await import('@/lib/services/azuracast.service')
      const azuracastService = createAzuraCastService()
      const station = await azuracastService.getStation(config.azuracastStationId)

      if (station.listen_url) {
        streamUrl = station.listen_url

        // Update database if URL changed
        if (streamUrl !== config.streamUrl) {
          await prisma.streamingConfig.update({
            where: { id: config.id },
            data: { streamUrl },
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch stream URL from AzuraCast:', error)
      // Fall back to database URL or default mount
    }
  }

  // Fallback to mount point if no stream URL
  if (!streamUrl && defaultMount?.mountPoint) {
    const baseUrl = process.env.AZURACAST_URL || ''
    streamUrl = `${baseUrl}${defaultMount.mountPoint}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <PublicStreamPlayer
        stationName={config.streamName || organization.name}
        stationDescription={config.streamDescription || ''}
        genre={config.streamGenre || ''}
        streamUrl={streamUrl || ''}
        logoUrl={config.logoUrl || null}
        accentColor={config.playerAccentColor || '#06b6d4'}
        organizationSlug={slug}
        stationId={config.azuracastStationId}
      />
    </div>
  )
}
