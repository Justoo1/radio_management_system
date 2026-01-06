"use client";

import { FeatureGuard } from "@/components/feature-guard";
import { Feature } from "@/lib/features";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  DollarSign,
  Play,
  Target,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Package,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

interface AnalyticsData {
  summary: {
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalPlays: number;
    completionRate: number;
  };
  revenue: {
    currency: string;
    potential: number;
    invoiced: number;
    paid: number;
    pending: number;
    monthlyTrend: Array<{
      month: string;
      total: number;
      paid: number;
    }>;
  };
  plays: {
    total: number;
    byStatus: Record<string, number>;
    byDaypart: Array<{ name: string; count: number }>;
    byProgram: Array<{ id: string; name: string; count: number }>;
  };
  fulfillment: {
    distribution: Record<string, number>;
    readyForInvoice: Array<{
      id: string;
      name: string;
      completedPlays: number;
      status: string;
    }>;
    behindSchedule: Array<{
      id: string;
      name: string;
      targetPlays: number;
      completedPlays: number;
    }>;
  };
  topPackages: Array<{
    id: string;
    name: string;
    type: string;
    price: number;
    campaignsUsing: number;
  }>;
  daypartPerformance: Array<{
    id: string;
    name: string;
    multiplier: number;
    packages: number;
    campaigns: number;
  }>;
}

const PLAY_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-green-500", text: "text-green-400" },
  PARTIAL: { bg: "bg-yellow-500", text: "text-yellow-400" },
  SKIPPED: { bg: "bg-orange-500", text: "text-orange-400" },
  FAILED: { bg: "bg-red-500", text: "text-red-400" },
};

const FULFILLMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-500/20 text-gray-400",
  IN_PROGRESS: "bg-blue-500/20 text-blue-400",
  ON_TRACK: "bg-green-500/20 text-green-400",
  BEHIND: "bg-yellow-500/20 text-yellow-400",
  COMPLETED: "bg-green-500/20 text-green-400",
  OVER_DELIVERED: "bg-purple-500/20 text-purple-400",
};

export default function AdvertisingAnalyticsPage() {
  return (
    <FeatureGuard
      feature={Feature.ADVERTISEMENTS}
      featureDescription="View advertising analytics and insights"
    >
      <AnalyticsContent />
    </FeatureGuard>
  );
}

function AnalyticsContent() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ads/analytics");
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data.data);
      } else {
        toast.error(data.error || "Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (amount: number) => {
    return `GH₵ ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-slate-400">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Failed to load analytics</p>
          <Button onClick={fetchAnalytics}>Retry</Button>
        </div>
      </div>
    );
  }

  const totalFulfillment = Object.values(analytics.fulfillment.distribution).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/advertising"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Advertising
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Advertising Analytics</h1>
        <p className="text-slate-400">
          Comprehensive overview of your advertising performance
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Campaigns</span>
          </div>
          <p className="text-3xl font-bold text-white">{analytics.summary.totalCampaigns}</p>
          <p className="text-xs text-slate-500 mt-1">
            {analytics.summary.activeCampaigns} active
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <Play className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Plays</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {analytics.summary.totalPlays.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {analytics.summary.completionRate.toFixed(1)}% completion rate
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Revenue</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(analytics.revenue.invoiced)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {formatCurrency(analytics.revenue.paid)} collected
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-slate-400 text-sm">Potential Revenue</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(analytics.revenue.potential)}
          </p>
          <p className="text-xs text-slate-500 mt-1">From active campaigns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Play Status Distribution */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Play Status</h3>
          <div className="space-y-3">
            {Object.entries(analytics.plays.byStatus).map(([status, count]) => {
              const percentage =
                analytics.plays.total > 0 ? (count / analytics.plays.total) * 100 : 0;
              const colors = PLAY_STATUS_COLORS[status] || {
                bg: "bg-gray-500",
                text: "text-gray-400",
              };

              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm ${colors.text}`}>{status}</span>
                    <span className="text-white text-sm">
                      {count.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors.bg}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fulfillment Status Distribution */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Campaign Fulfillment</h3>
          <div className="space-y-3">
            {Object.entries(analytics.fulfillment.distribution).map(([status, count]) => {
              const percentage = totalFulfillment > 0 ? (count / totalFulfillment) * 100 : 0;

              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm px-2 py-0.5 rounded-full ${
                        FULFILLMENT_STATUS_COLORS[status] || "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {status.replace(/_/g, " ")}
                    </span>
                    <span className="text-white text-sm">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Programs */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Top Programs for Ads</h3>
          {analytics.plays.byProgram.length === 0 ? (
            <p className="text-slate-400 text-sm">No program data yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.plays.byProgram.slice(0, 5).map((program, index) => (
                <div key={program.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-xs text-purple-400">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{program.name}</p>
                    <p className="text-slate-500 text-xs">{program.count} plays</p>
                  </div>
                  <Radio className="w-4 h-4 text-slate-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Campaigns Ready for Invoice */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Ready for Invoice</h3>
            <FileText className="w-5 h-5 text-green-400" />
          </div>
          {analytics.fulfillment.readyForInvoice.length === 0 ? (
            <p className="text-slate-400 text-sm">No campaigns ready for invoicing</p>
          ) : (
            <div className="space-y-3">
              {analytics.fulfillment.readyForInvoice.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/advertising/${campaign.id}`}
                  className="block p-3 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{campaign.name}</p>
                      <p className="text-green-400 text-sm">
                        {campaign.completedPlays} plays completed
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Campaigns Behind Schedule */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Needs Attention</h3>
            <AlertCircle className="w-5 h-5 text-yellow-400" />
          </div>
          {analytics.fulfillment.behindSchedule.length === 0 ? (
            <p className="text-slate-400 text-sm">All campaigns are on track</p>
          ) : (
            <div className="space-y-3">
              {analytics.fulfillment.behindSchedule.map((campaign) => {
                const progress = campaign.targetPlays
                  ? (campaign.completedPlays / campaign.targetPlays) * 100
                  : 0;

                return (
                  <Link
                    key={campaign.id}
                    href={`/advertising/${campaign.id}`}
                    className="block p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{campaign.name}</p>
                      <span className="text-yellow-400 text-sm">
                        {campaign.completedPlays}/{campaign.targetPlays}
                      </span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Packages */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Popular Packages</h3>
            <Package className="w-5 h-5 text-purple-400" />
          </div>
          {analytics.topPackages.length === 0 ? (
            <p className="text-slate-400 text-sm">No packages created yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.topPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-3 bg-white/5 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-medium">{pkg.name}</p>
                    <p className="text-slate-400 text-sm">
                      {pkg.type.replace(/_/g, " ")} • {formatCurrency(pkg.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-semibold">{pkg.campaignsUsing}</p>
                    <p className="text-slate-500 text-xs">campaigns</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daypart Performance */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Daypart Performance</h3>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          {analytics.daypartPerformance.length === 0 ? (
            <p className="text-slate-400 text-sm">No dayparts configured yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.daypartPerformance.map((daypart) => (
                <div
                  key={daypart.id}
                  className="p-3 bg-white/5 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-medium">{daypart.name}</p>
                    <p className="text-slate-400 text-sm">
                      {daypart.multiplier}x multiplier
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 font-semibold">
                      {daypart.campaigns} campaigns
                    </p>
                    <p className="text-slate-500 text-xs">{daypart.packages} packages</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Revenue Trend */}
      {analytics.revenue.monthlyTrend.length > 0 && (
        <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Revenue Trend</h3>
          <div className="h-48 flex items-end justify-between gap-2">
            {analytics.revenue.monthlyTrend.map((month) => {
              const maxTotal = Math.max(
                ...analytics.revenue.monthlyTrend.map((m) => m.total)
              );
              const heightPercent = maxTotal > 0 ? (month.total / maxTotal) * 100 : 0;
              const paidPercent = month.total > 0 ? (month.paid / month.total) * 100 : 0;

              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-white/5 rounded-t-lg relative overflow-hidden"
                    style={{ height: `${Math.max(heightPercent, 10)}%` }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-green-400"
                      style={{ height: `${paidPercent}%` }}
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500/50 to-blue-400/50"
                      style={{ height: "100%" }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">
                      {new Date(month.month + "-01").toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </p>
                    <p className="text-xs text-white">{formatCurrency(month.total)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500/50" />
              <span className="text-xs text-slate-400">Invoiced</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-xs text-slate-400">Paid</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
