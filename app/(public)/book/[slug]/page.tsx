/**
 * Public Airtime Booking Page
 * Allows guests to book airtime slots
 */

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import BookingForm from './BookingForm'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params

  const organization = await prisma.organization.findFirst({
    where: { slug },
  })

  if (!organization) {
    return { title: 'Station Not Found' }
  }

  return {
    title: `Book Airtime - ${organization.name}`,
    description: `Book your broadcast time on ${organization.name}. Pay securely and get your DJ credentials instantly.`,
  }
}

export default async function PublicBookingPage({ params }: Props) {
  const { slug } = await params

  const organization = await prisma.organization.findFirst({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      streamingConfig: true,
      hasPaymentAccount: true,
    },
  })

  if (!organization) {
    notFound()
  }

  // Check if streaming is configured
  if (!organization.streamingConfig?.azuracastStationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Booking Unavailable</h1>
          <p className="text-slate-400">This station has not enabled airtime booking yet.</p>
        </div>
      </div>
    )
  }

  // Check if organization has setup payment account
  if (!organization.hasPaymentAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Payment Setup Required</h1>
          <p className="text-slate-400">
            This station has not completed their payment account setup yet.
            Please contact the station or check back later.
          </p>
        </div>
      </div>
    )
  }

  // Fetch active packages
  const packages = await prisma.airtimePackage.findMany({
    where: {
      organizationId: organization.id,
      isActive: true,
    },
    orderBy: { sortOrder: 'asc' },
  })

  if (packages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No Packages Available</h1>
          <p className="text-slate-400">There are no airtime packages available for booking at this time.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <BookingForm
        organizationName={organization.name}
        organizationSlug={slug}
        packages={packages.map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          durationMinutes: pkg.durationMinutes,
          price: Number(pkg.price),
          currency: pkg.currency,
        }))}
      />
    </div>
  )
}
