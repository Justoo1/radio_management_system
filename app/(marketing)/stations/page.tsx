/**
 * Public Radio Stations Directory
 * Displays all registered radio stations with their features
 */

import { Metadata } from "next";
import Link from "next/link";
import { Radio, Wifi, Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Radio Stations Directory | Radio Management System",
  description: "Browse all registered radio stations and listen live online",
};

interface Station {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  city: string | null;
  state: string | null;
  streamingConfig: {
    streamName: string | null;
    streamGenre: string | null;
  } | null;
  features: {
    streaming: boolean;
    airtime: boolean;
    traditionalFM: boolean;
  };
}

async function getStations(): Promise<Station[]> {
  try {
    // Get all organizations with ACTIVE status
    const organizations = await prisma.organization.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        streamingConfig: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Map organizations to public format with feature flags
    const publicStations = organizations.map((org) => {
      // Parse enabled features
      let enabledFeatures: string[] = [];
      try {
        enabledFeatures = org.enabledFeatures
          ? JSON.parse(org.enabledFeatures as string)
          : [];
      } catch {
        enabledFeatures = [];
      }

      // Check if streaming is enabled
      const hasStreaming =
        enabledFeatures.includes("streaming") &&
        org.streamingConfig?.isEnabled;

      // Check if airtime is enabled
      const hasAirtime = enabledFeatures.includes("airtime");

      const station: Station = {
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.streamingConfig?.streamDescription ?? null,
        logo: org.logo,
        city: org.city,
        state: org.region,
        streamingConfig: hasStreaming
          ? {
              streamName: (org.streamingConfig?.streamName ?? null) as string | null,
              streamGenre: (org.streamingConfig?.streamGenre ?? null) as string | null,
            }
          : null,
        features: {
          streaming: !!hasStreaming,
          airtime: !!hasAirtime,
          traditionalFM: true,
        },
      };
      return station;
    });

    return publicStations;
  } catch (error) {
    console.error("Error fetching stations:", error);
    return [];
  }
}

export default async function StationsPage() {
  const stations = await getStations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
            Radio Stations Directory
          </h1>
          <p className="text-lg text-purple-100 max-w-2xl mx-auto">
            Discover and connect with radio stations across Ghana. Listen live
            online or request airtime for your programs.
          </p>
        </div>

        {/* Stations Grid */}
        {stations.length === 0 ? (
          <div className="text-center py-12">
            <Radio className="h-16 w-16 text-purple-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-white">No stations yet</h2>
            <p className="text-purple-200">
              Check back soon for registered radio stations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.map((station) => (
              <Link
                key={station.id}
                href={`/stations/${station.slug}`}
                className="block transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
              >
                <Card className="h-full p-6 bg-white/5 border-purple-500/20 backdrop-blur-sm hover:bg-white/10 transition-all">
                  {/* Logo & Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                      {station.logo ? (
                        <img
                          src={station.logo}
                          alt={station.name}
                          className="h-16 w-16 rounded-lg object-cover border-2 border-purple-500/30"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border-2 border-purple-500/30">
                          <Radio className="h-8 w-8 text-purple-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate text-white">
                        {station.name}
                      </h3>
                      {(station.city || station.state) && (
                        <div className="flex items-center gap-1 text-sm text-purple-200">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {[station.city, station.state]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {station.description && (
                    <p className="text-sm text-purple-100 mb-4 line-clamp-2">
                      {station.description}
                    </p>
                  )}

                  {/* Genre */}
                  {station.streamingConfig?.streamGenre && (
                    <div className="mb-4">
                      <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                        {station.streamingConfig.streamGenre}
                      </Badge>
                    </div>
                  )}

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-purple-500/20">
                    {station.features.streaming && (
                      <Badge
                        className="flex items-center gap-1 bg-purple-500/10 text-purple-200 border-purple-500/30"
                      >
                        <Wifi className="h-3 w-3" />
                        Online Streaming
                      </Badge>
                    )}
                    {station.features.airtime && (
                      <Badge
                        className="flex items-center gap-1 bg-pink-500/10 text-pink-200 border-pink-500/30"
                      >
                        <Clock className="h-3 w-3" />
                        Airtime Booking
                      </Badge>
                    )}
                    {!station.features.streaming &&
                      !station.features.airtime &&
                      station.features.traditionalFM && (
                        <Badge
                          className="flex items-center gap-1 bg-white/10 text-purple-200 border-white/20"
                        >
                          <Radio className="h-3 w-3" />
                          Traditional FM
                        </Badge>
                      )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
