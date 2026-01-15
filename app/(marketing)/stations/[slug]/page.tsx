/**
 * Station Detail Page
 * Shows station information and links to streaming/airtime features
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Radio,
  Wifi,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

interface Station {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  streamingConfig: {
    streamName: string | null;
    streamDescription: string | null;
    streamGenre: string | null;
    streamUrl: string | null;
  } | null;
  features: {
    streaming: boolean;
    airtime: boolean;
    traditionalFM: boolean;
  };
}

async function getStation(slug: string): Promise<Station | null> {
  try {
    const organization = await prisma.organization.findFirst({
      where: {
        slug,
        status: "ACTIVE",
      },
      include: {
        streamingConfig: true,
      },
    });

    if (!organization) {
      return null;
    }

    // Parse enabled features
    let enabledFeatures: string[] = [];
    try {
      enabledFeatures = organization.enabledFeatures
        ? JSON.parse(organization.enabledFeatures as string)
        : [];
    } catch {
      enabledFeatures = [];
    }

    // Check if streaming is enabled
    const hasStreaming =
      enabledFeatures.includes("streaming") &&
      organization.streamingConfig?.isEnabled;

    // Check if airtime is enabled
    const hasAirtime = enabledFeatures.includes("airtime");

    // If streaming is enabled, fetch fresh stream URL from AzuraCast
    let streamUrl = organization.streamingConfig?.streamUrl;

    if (
      hasStreaming &&
      organization.streamingConfig?.azuracastStationId &&
      process.env.AZURACAST_URL
    ) {
      try {
        const { createAzuraCastService } = await import(
          "@/lib/services/azuracast.service"
        );
        const azuracastService = createAzuraCastService();
        const station = await azuracastService.getStation(
          organization.streamingConfig.azuracastStationId
        );

        if (station.listen_url) {
          streamUrl = station.listen_url;

          // Update database if URL changed
          if (streamUrl !== organization.streamingConfig.streamUrl) {
            await prisma.streamingConfig.update({
              where: { id: organization.streamingConfig.id },
              data: { streamUrl },
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch stream URL from AzuraCast:", error);
        // Continue with database URL
      }
    }

    const publicStation: Station = {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      description: organization.streamingConfig?.streamDescription ?? null,
      logo: organization.logo,
      website: organization.website,
      phone: organization.phone,
      email: organization.email,
      address: organization.address,
      city: organization.city,
      state: organization.region,
      country: organization.country,
      streamingConfig: hasStreaming
        ? {
            streamName: (organization.streamingConfig?.streamName ?? null) as string | null,
            streamDescription: (organization.streamingConfig?.streamDescription ?? null) as string | null,
            streamGenre: (organization.streamingConfig?.streamGenre ?? null) as string | null,
            streamUrl: (streamUrl ?? null) as string | null,
          }
        : null,
      features: {
        streaming: !!hasStreaming,
        airtime: !!hasAirtime,
        traditionalFM: true,
      },
    };

    return publicStation;
  } catch (error) {
    console.error("Error fetching station:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const station = await getStation(slug);

  if (!station) {
    return {
      title: "Station Not Found",
    };
  }

  return {
    title: `${station.name} | Radio Stations Directory`,
    description:
      station.description ||
      `Listen to ${station.name} online or request airtime`,
  };
}

export default async function StationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const station = await getStation(slug);

  if (!station) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Back Link */}
        <Link
          href="/stations"
          className="inline-flex items-center gap-2 text-sm text-purple-200 hover:text-white mb-8 transition-colors"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          Back to all stations
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Station Header */}
            <div className="flex items-start gap-6">
              {station.logo ? (
                <img
                  src={station.logo}
                  alt={station.name}
                  className="h-24 w-24 rounded-xl object-cover border-2 border-purple-500/30"
                />
              ) : (
                <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 border-2 border-purple-500/30">
                  <Radio className="h-12 w-12 text-purple-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                  {station.name}
                </h1>
                {(station.city || station.state) && (
                  <div className="flex items-center gap-2 text-purple-200 mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[station.city, station.state, station.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {station.streamingConfig?.streamGenre && (
                  <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                    {station.streamingConfig.streamGenre}
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            {(station.description ||
              station.streamingConfig?.streamDescription) && (
              <Card className="p-6 bg-white/5 border-purple-500/20 backdrop-blur-sm">
                <h2 className="text-xl font-semibold mb-3 text-white">About</h2>
                <p className="text-purple-100 leading-relaxed">
                  {station.description ||
                    station.streamingConfig?.streamDescription}
                </p>
              </Card>
            )}

            {/* Features & Actions */}
            <Card className="p-6 bg-white/5 border-purple-500/20 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4 text-white">
                Connect with {station.name}
              </h2>
              <div className="space-y-4">
                {/* Streaming */}
                {station.features.streaming && (
                  <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border-2 border-purple-500/30 backdrop-blur-sm">
                    <div className="flex-shrink-0">
                      <Wifi className="h-6 w-6 text-purple-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 text-white">Listen Live Online</h3>
                      <p className="text-sm text-purple-100 mb-3">
                        Stream {station.streamingConfig?.streamName || station.name} live from
                        anywhere in the world
                      </p>
                      <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">
                        <Link href={`/stream/${station.slug}`}>
                          Listen Now
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Airtime Booking */}
                {station.features.airtime && (
                  <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg border-2 border-pink-500/30 backdrop-blur-sm">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-pink-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 text-white">Book Airtime</h3>
                      <p className="text-sm text-purple-100 mb-3">
                        Request airtime for your program, advertisement, or live
                        broadcast
                      </p>
                      <Button asChild className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/20">
                        <Link href={`/book/${station.slug}`}>
                          Request Airtime
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Traditional FM (if no pro features) */}
                {!station.features.streaming && !station.features.airtime && (
                  <div className="flex items-start gap-4 p-5 bg-white/5 rounded-lg border border-purple-500/20">
                    <div className="flex-shrink-0">
                      <Radio className="h-6 w-6 text-purple-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 text-white">
                        Traditional FM Station
                      </h3>
                      <p className="text-sm text-purple-200">
                        This station broadcasts on traditional FM radio. Contact
                        them directly for more information about their programs
                        and services.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="p-6 bg-white/5 border-purple-500/20 backdrop-blur-sm">
              <h2 className="text-lg font-semibold mb-4 text-white">Contact Information</h2>
              <div className="space-y-3">
                {station.phone && (
                  <a
                    href={`tel:${station.phone}`}
                    className="flex items-center gap-3 text-sm hover:text-pink-300 transition-colors text-purple-100"
                  >
                    <Phone className="h-4 w-4 text-purple-300" />
                    <span>{station.phone}</span>
                  </a>
                )}
                {station.email && (
                  <a
                    href={`mailto:${station.email}`}
                    className="flex items-center gap-3 text-sm hover:text-pink-300 transition-colors text-purple-100"
                  >
                    <Mail className="h-4 w-4 text-purple-300" />
                    <span className="truncate">{station.email}</span>
                  </a>
                )}
                {station.website && (
                  <a
                    href={station.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm hover:text-pink-300 transition-colors text-purple-100"
                  >
                    <Globe className="h-4 w-4 text-purple-300" />
                    <span className="truncate">Visit Website</span>
                  </a>
                )}
                {station.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-purple-300 mt-0.5" />
                    <span className="text-purple-200">
                      {station.address}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Available Features */}
            <Card className="p-6 bg-white/5 border-purple-500/20 backdrop-blur-sm">
              <h2 className="text-lg font-semibold mb-4 text-white">Available Features</h2>
              <div className="space-y-2">
                {station.features.streaming && (
                  <div className="flex items-center gap-2 text-sm text-purple-100">
                    <Wifi className="h-4 w-4 text-green-400" />
                    <span>Online Streaming</span>
                  </div>
                )}
                {station.features.airtime && (
                  <div className="flex items-center gap-2 text-sm text-purple-100">
                    <Clock className="h-4 w-4 text-green-400" />
                    <span>Airtime Booking</span>
                  </div>
                )}
                {station.features.traditionalFM && (
                  <div className="flex items-center gap-2 text-sm text-purple-100">
                    <Radio className="h-4 w-4 text-green-400" />
                    <span>FM Broadcasting</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
