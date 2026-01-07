"use client";

import { FeatureGuard } from "@/components/feature-guard";
import { Feature } from "@/lib/features";
import { useState, useEffect, use } from "react";
import {
  ArrowLeft,
  Plus,
  Play,
  Pause,
  Clock,
  DollarSign,
  Calendar,
  Users,
  Target,
  TrendingUp,
  BarChart3,
  FileText,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Music,
  Volume2,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Program {
  id: string;
  name: string;
}

interface Presenter {
  id: string;
  name: string;
}

interface AdPackage {
  id: string;
  name: string;
  packageType: string;
  totalPlays: number | null;
  durationDays: number | null;
  playsPerDay: number | null;
  basePrice: number;
  daypart?: {
    id: string;
    name: string;
    priceMultiplier: number;
  };
}

interface Advertisement {
  id: string;
  title: string;
  duration: number;
  adType: string;
  totalPlays: number;
  status: string;
  mediaFile?: {
    id: string;
    fileName: string;
    fileUrl: string;
  };
  _count?: {
    playHistory: number;
    slots: number;
  };
}

interface AdSlot {
  id: string;
  scheduledTime: string;
  wasPlayed: boolean;
  playedAt: string | null;
  advertisement: {
    id: string;
    title: string;
  };
}

interface PlayHistory {
  id: string;
  playedAt: string;
  playDuration: number;
  playStatus: string;
  daypartName: string | null;
  timeOfDay: string | null;
  notes: string | null;
  advertisement: {
    id: string;
    title: string;
  };
  program?: {
    id: string;
    name: string;
  };
  presenter?: {
    id: string;
    name: string;
  };
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  budget: number | null;
  startDate: string;
  endDate: string;
  status: string;
  scheduleType: string;
  targetPlays: number | null;
  completedPlays: number;
  fulfillmentStatus: string;
  client: Client;
  package: AdPackage | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    totalAmount: number;
  };
  advertisements: Advertisement[];
  playStats?: {
    total: number;
    completed: number;
    partial: number;
    skipped: number;
    failed: number;
  };
  fulfillmentRate?: number;
  daysRemaining?: number;
  _count?: {
    advertisements: number;
    adSlots: number;
  };
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", color: "gray" },
  { value: "ACTIVE", label: "Active", color: "green" },
  { value: "PAUSED", label: "Paused", color: "yellow" },
  { value: "COMPLETED", label: "Completed", color: "blue" },
  { value: "CANCELLED", label: "Cancelled", color: "red" },
];

const FULFILLMENT_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", color: "gray", icon: Clock },
  { value: "IN_PROGRESS", label: "In Progress", color: "blue", icon: RefreshCw },
  { value: "ON_TRACK", label: "On Track", color: "green", icon: CheckCircle2 },
  { value: "BEHIND", label: "Behind", color: "yellow", icon: AlertCircle },
  { value: "COMPLETED", label: "Completed", color: "green", icon: CheckCircle2 },
  { value: "OVER_DELIVERED", label: "Over Delivered", color: "purple", icon: TrendingUp },
];

const PLAY_STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-500/20 text-green-400",
  PARTIAL: "bg-yellow-500/20 text-yellow-400",
  SKIPPED: "bg-orange-500/20 text-orange-400",
  FAILED: "bg-red-500/20 text-red-400",
};

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <FeatureGuard
      feature={Feature.ADVERTISEMENTS}
      featureDescription="View and manage advertising campaign details"
    >
      <CampaignDetailContent campaignId={resolvedParams.id} />
    </FeatureGuard>
  );
}

function CampaignDetailContent({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Play history state
  const [playHistory, setPlayHistory] = useState<PlayHistory[]>([]);
  const [playHistoryLoading, setPlayHistoryLoading] = useState(false);
  const [playHistoryTotal, setPlayHistoryTotal] = useState(0);

  // Ad slots state
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [adSlotsLoading, setAdSlotsLoading] = useState(false);

  // Dialog states
  const [showAddAdDialog, setShowAddAdDialog] = useState(false);
  const [showGenerateInvoiceDialog, setShowGenerateInvoiceDialog] = useState(false);
  const [showRecordPlayDialog, setShowRecordPlayDialog] = useState(false);

  // Programs and presenters for record play
  const [programs, setPrograms] = useState<Program[]>([]);
  const [presenters, setPresenters] = useState<Presenter[]>([]);

  // Form states
  const [adForm, setAdForm] = useState({
    title: "",
    duration: "30",
    adType: "AUDIO",
    notes: "",
  });

  const [invoiceForm, setInvoiceForm] = useState({
    dueDate: "",
    notes: "",
    includeBreakdown: true,
  });

  const [recordPlayForm, setRecordPlayForm] = useState({
    advertisementId: "",
    playDuration: "",
    programId: "",
    presenterId: "",
    playStatus: "COMPLETED",
    notes: "",
  });

  // Loading states for form submissions
  const [addingAd, setAddingAd] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [recordingPlay, setRecordingPlay] = useState(false);
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);

  // Fetch campaign details
  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ads/campaigns/${campaignId}`);
      const data = await response.json();

      if (response.ok) {
        setCampaign(data.data);
      } else {
        toast.error(data.error || "Failed to fetch campaign");
        if (response.status === 404) {
          router.push("/advertising");
        }
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to fetch campaign");
    } finally {
      setLoading(false);
    }
  };

  // Fetch play history
  const fetchPlayHistory = async () => {
    try {
      setPlayHistoryLoading(true);
      const response = await fetch(`/api/ads/play?campaignId=${campaignId}&limit=50`);
      const data = await response.json();

      if (response.ok) {
        setPlayHistory(data.data || []);
        setPlayHistoryTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching play history:", error);
    } finally {
      setPlayHistoryLoading(false);
    }
  };

  // Fetch programs for record play
  const fetchPrograms = async () => {
    try {
      const response = await fetch("/api/programs?limit=100");
      const data = await response.json();
      if (response.ok) {
        setPrograms(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  // Fetch presenters (users) for record play
  const fetchPresenters = async () => {
    try {
      const response = await fetch("/api/users?limit=100");
      const data = await response.json();
      if (response.ok) {
        setPresenters(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching presenters:", error);
    }
  };

  useEffect(() => {
    fetchCampaign();
    fetchPrograms();
    fetchPresenters();
  }, [campaignId]);

  useEffect(() => {
    if (activeTab === "plays" && campaign) {
      fetchPlayHistory();
    }
  }, [activeTab, campaign]);

  // Add advertisement
  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAd(true);

    try {
      const response = await fetch("/api/ads/advertisements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          title: adForm.title,
          duration: parseInt(adForm.duration),
          adType: adForm.adType,
          notes: adForm.notes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Advertisement added successfully!");
        setShowAddAdDialog(false);
        setAdForm({ title: "", duration: "30", adType: "AUDIO", notes: "" });
        fetchCampaign();
      } else {
        toast.error(data.error || "Failed to add advertisement");
      }
    } catch (error) {
      console.error("Error adding advertisement:", error);
      toast.error("Failed to add advertisement");
    } finally {
      setAddingAd(false);
    }
  };

  // Generate invoice
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingInvoice(true);

    try {
      const response = await fetch(`/api/ads/campaigns/${campaignId}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: invoiceForm.dueDate || undefined,
          notes: invoiceForm.notes || undefined,
          includeBreakdown: invoiceForm.includeBreakdown,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Invoice generated successfully!");
        setShowGenerateInvoiceDialog(false);
        fetchCampaign();
      } else {
        toast.error(data.error || "Failed to generate invoice");
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // Delete advertisement
  const handleDeleteAd = async (adId: string) => {
    if (!confirm("Are you sure you want to delete this advertisement?")) return;
    setDeletingAdId(adId);

    try {
      const response = await fetch(`/api/ads/advertisements/${adId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Advertisement deleted successfully");
        fetchCampaign();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete advertisement");
      }
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      toast.error("Failed to delete advertisement");
    } finally {
      setDeletingAdId(null);
    }
  };

  // Record ad play
  const handleRecordPlay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recordPlayForm.advertisementId) {
      toast.error("Please select an advertisement");
      return;
    }

    setRecordingPlay(true);
    const selectedAd = campaign?.advertisements.find(
      (ad) => ad.id === recordPlayForm.advertisementId
    );

    try {
      const response = await fetch("/api/ads/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advertisementId: recordPlayForm.advertisementId,
          playDuration: parseInt(recordPlayForm.playDuration) || selectedAd?.duration || 30,
          programId: recordPlayForm.programId || undefined,
          presenterId: recordPlayForm.presenterId || undefined,
          playStatus: recordPlayForm.playStatus,
          notes: recordPlayForm.notes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Ad play recorded successfully!");
        setShowRecordPlayDialog(false);
        setRecordPlayForm({
          advertisementId: "",
          playDuration: "",
          programId: "",
          presenterId: "",
          playStatus: "COMPLETED",
          notes: "",
        });
        fetchCampaign();
        if (activeTab === "plays") {
          fetchPlayHistory();
        }
      } else {
        toast.error(data.error || "Failed to record ad play");
      }
    } catch (error) {
      console.error("Error recording ad play:", error);
      toast.error("Failed to record ad play");
    } finally {
      setRecordingPlay(false);
    }
  };

  // Open record play dialog with pre-selected ad
  const openRecordPlayDialog = (adId?: string) => {
    if (adId) {
      const selectedAd = campaign?.advertisements.find((ad) => ad.id === adId);
      setRecordPlayForm({
        ...recordPlayForm,
        advertisementId: adId,
        playDuration: selectedAd?.duration?.toString() || "30",
      });
    }
    setShowRecordPlayDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return `GH₵ ${amount.toLocaleString()}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status: string) => {
    const colors: Record<string, string> = {
      gray: "bg-gray-500/20 text-gray-300",
      green: "bg-green-500/20 text-green-300",
      yellow: "bg-yellow-500/20 text-yellow-300",
      blue: "bg-blue-500/20 text-blue-300",
      red: "bg-red-500/20 text-red-300",
      purple: "bg-purple-500/20 text-purple-300",
    };
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    return colors[statusOption?.color || "gray"];
  };

  const getFulfillmentBadge = (status: string) => {
    const option = FULFILLMENT_STATUS_OPTIONS.find((s) => s.value === status);
    if (!option) return null;

    const colors: Record<string, string> = {
      gray: "bg-gray-500/20 text-gray-300",
      green: "bg-green-500/20 text-green-300",
      yellow: "bg-yellow-500/20 text-yellow-300",
      blue: "bg-blue-500/20 text-blue-300",
      purple: "bg-purple-500/20 text-purple-300",
    };

    const Icon = option.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${colors[option.color]}`}>
        <Icon className="w-4 h-4" />
        {option.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-slate-400">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Campaign not found</p>
          <Link href="/advertising">
            <Button>Back to Campaigns</Button>
          </Link>
        </div>
      </div>
    );
  }

  const fulfillmentRate = campaign.targetPlays
    ? Math.round((campaign.completedPlays / campaign.targetPlays) * 100)
    : 0;

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/advertising"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(campaign.status)}`}>
                {STATUS_OPTIONS.find((s) => s.value === campaign.status)?.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {campaign.client.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {!campaign.invoice && (
              <Button
                onClick={() => setShowGenerateInvoiceDialog(true)}
                variant="outline"
                className="border-green-500/50 text-green-400 hover:bg-green-500/20"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Invoice
              </Button>
            )}
            {campaign.advertisements.length > 0 && (
              <Button
                onClick={() => openRecordPlayDialog()}
                variant="outline"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
              >
                <Play className="w-4 h-4 mr-2" />
                Record Play
              </Button>
            )}
            <Button
              onClick={() => setShowAddAdDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Advertisement
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/10 border border-white/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500/20">
            Overview
          </TabsTrigger>
          <TabsTrigger value="ads" className="data-[state=active]:bg-purple-500/20">
            Advertisements ({campaign.advertisements.length})
          </TabsTrigger>
          <TabsTrigger value="plays" className="data-[state=active]:bg-purple-500/20">
            Play History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-500/20">
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Fulfillment Progress */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Campaign Fulfillment</h3>
              {getFulfillmentBadge(campaign.fulfillmentStatus)}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Progress</span>
                <span className="text-white font-semibold">
                  {campaign.completedPlays} / {campaign.targetPlays || "∞"} plays
                </span>
              </div>
              <Progress value={fulfillmentRate} className="h-3" />
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-slate-500">{fulfillmentRate}% complete</span>
                {campaign.daysRemaining !== undefined && (
                  <span className="text-slate-500">
                    {campaign.daysRemaining > 0
                      ? `${campaign.daysRemaining} days remaining`
                      : "Campaign ended"}
                  </span>
                )}
              </div>
            </div>

            {/* Play Stats */}
            {campaign.playStats && (
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{campaign.playStats.completed}</p>
                  <p className="text-xs text-slate-400">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{campaign.playStats.partial}</p>
                  <p className="text-xs text-slate-400">Partial</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-400">{campaign.playStats.skipped}</p>
                  <p className="text-xs text-slate-400">Skipped</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{campaign.playStats.failed}</p>
                  <p className="text-xs text-slate-400">Failed</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-slate-400 text-sm">Budget</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(Number(campaign.budget || 0))}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-slate-400 text-sm">Target Plays</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {campaign.targetPlays || "Unlimited"}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Play className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-slate-400 text-sm">Completed Plays</span>
              </div>
              <p className="text-2xl font-bold text-white">{campaign.completedPlays}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-500/20 p-2 rounded-lg">
                  <Music className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-slate-400 text-sm">Advertisements</span>
              </div>
              <p className="text-2xl font-bold text-white">{campaign.advertisements.length}</p>
            </div>
          </div>

          {/* Package & Invoice Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Package Info */}
            {campaign.package && (
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Package Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Package</span>
                    <span className="text-white font-medium">{campaign.package.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Type</span>
                    <span className="text-white">{campaign.package.packageType.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Base Price</span>
                    <span className="text-white">{formatCurrency(Number(campaign.package.basePrice))}</span>
                  </div>
                  {campaign.package.daypart && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Daypart</span>
                      <span className="text-white">
                        {campaign.package.daypart.name} ({campaign.package.daypart.priceMultiplier}x)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoice Info */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Invoice</h3>
              {campaign.invoice ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Invoice #</span>
                    <span className="text-white font-medium">{campaign.invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Amount</span>
                    <span className="text-white">{formatCurrency(Number(campaign.invoice.totalAmount))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      campaign.invoice.status === "PAID" ? "bg-green-500/20 text-green-400" :
                      campaign.invoice.status === "DRAFT" ? "bg-gray-500/20 text-gray-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {campaign.invoice.status}
                    </span>
                  </div>
                  <Link href={`/invoices/${campaign.invoice.id}`}>
                    <Button variant="outline" className="w-full mt-2">
                      View Invoice
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-400 mb-4">No invoice generated yet</p>
                  <Button
                    onClick={() => setShowGenerateInvoiceDialog(true)}
                    variant="outline"
                    className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Invoice
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {campaign.description && (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-slate-300">{campaign.description}</p>
            </div>
          )}
        </TabsContent>

        {/* Advertisements Tab */}
        <TabsContent value="ads" className="space-y-6">
          {campaign.advertisements.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 border border-white/20 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-purple-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Volume2 className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">No Advertisements Yet</h3>
                <p className="text-slate-400 mb-6">
                  Add advertisements to this campaign to start tracking plays.
                </p>
                <Button
                  onClick={() => setShowAddAdDialog(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Advertisement
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {campaign.advertisements.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">{ad.title}</h4>
                      <p className="text-slate-400 text-sm">{ad.adType} • {ad.duration}s</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300"
                        onClick={() => openRecordPlayDialog(ad.id)}
                        title="Record Play"
                        disabled={deletingAdId === ad.id}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDeleteAd(ad.id)}
                        disabled={deletingAdId !== null}
                      >
                        {deletingAdId === ad.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">{ad.totalPlays}</p>
                      <p className="text-xs text-slate-400">Total Plays</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">{ad._count?.slots || 0}</p>
                      <p className="text-xs text-slate-400">Scheduled</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">{ad.duration}s</p>
                      <p className="text-xs text-slate-400">Duration</p>
                    </div>
                  </div>

                  {ad.mediaFile && (
                    <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                      <Music className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400 truncate flex-1">
                        {ad.mediaFile.fileName}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Play History Tab */}
        <TabsContent value="plays" className="space-y-6">
          {playHistoryLoading ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 border border-white/20 text-center">
              <p className="text-slate-400">Loading play history...</p>
            </div>
          ) : playHistory.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 border border-white/20 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">No Play History Yet</h3>
                <p className="text-slate-400">
                  Play history will appear here once ads from this campaign are played.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">
                  Play History ({playHistoryTotal} total)
                </h3>
              </div>
              <div className="divide-y divide-white/10">
                {playHistory.map((play) => (
                  <div key={play.id} className="p-4 hover:bg-white/5 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{play.advertisement.title}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${PLAY_STATUS_COLORS[play.playStatus]}`}>
                            {play.playStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{formatDateTime(play.playedAt)}</span>
                          <span>{play.playDuration}s played</span>
                          {play.program && <span>📻 {play.program.name}</span>}
                          {play.presenter && <span>🎙️ {play.presenter.name}</span>}
                          {play.daypartName && <span>🕐 {play.daypartName}</span>}
                        </div>
                        {play.notes && (
                          <p className="text-sm text-slate-500 mt-1">{play.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 border border-white/20 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-orange-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Analytics Coming Soon</h3>
              <p className="text-slate-400">
                Detailed analytics with charts showing play distribution by time, program, and daypart will be available here.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Advertisement Dialog */}
      <Dialog open={showAddAdDialog} onOpenChange={setShowAddAdDialog}>
        <DialogContent className="bg-slate-900 border-white/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Add Advertisement</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new advertisement to this campaign
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAd} className="space-y-4">
            <div>
              <Label className="text-slate-300">Title *</Label>
              <Input
                value={adForm.title}
                onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                required
                placeholder="e.g., Coca-Cola Summer Spot"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Duration (seconds) *</Label>
                <Input
                  type="number"
                  min="5"
                  max="300"
                  value={adForm.duration}
                  onChange={(e) => setAdForm({ ...adForm, duration: e.target.value })}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Type *</Label>
                <Select
                  value={adForm.adType}
                  onValueChange={(value) => setAdForm({ ...adForm, adType: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUDIO">Audio</SelectItem>
                    <SelectItem value="JINGLE">Jingle</SelectItem>
                    <SelectItem value="LIVE_READ">Live Read</SelectItem>
                    <SelectItem value="SPONSORSHIP">Sponsorship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Notes</Label>
              <Textarea
                value={adForm.notes}
                onChange={(e) => setAdForm({ ...adForm, notes: e.target.value })}
                placeholder="Additional notes..."
                className="bg-white/5 border-white/10 text-white"
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddAdDialog(false)}
                disabled={addingAd}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addingAd}>
                {addingAd ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Advertisement"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generate Invoice Dialog */}
      <Dialog open={showGenerateInvoiceDialog} onOpenChange={setShowGenerateInvoiceDialog}>
        <DialogContent className="bg-slate-900 border-white/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Generate Invoice</DialogTitle>
            <DialogDescription className="text-slate-400">
              Generate an invoice for this campaign
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGenerateInvoice} className="space-y-4">
            <div>
              <Label className="text-slate-300">Due Date</Label>
              <Input
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">
                Leave empty for 30 days from today
              </p>
            </div>

            <div>
              <Label className="text-slate-300">Notes</Label>
              <Textarea
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                placeholder="Invoice notes..."
                className="bg-white/5 border-white/10 text-white"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeBreakdown"
                checked={invoiceForm.includeBreakdown}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, includeBreakdown: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="includeBreakdown" className="text-slate-300">
                Include play breakdown by daypart
              </Label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowGenerateInvoiceDialog(false)}
                disabled={generatingInvoice}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={generatingInvoice}
              >
                {generatingInvoice ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Invoice"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Play Dialog */}
      <Dialog open={showRecordPlayDialog} onOpenChange={setShowRecordPlayDialog}>
        <DialogContent className="bg-slate-900 border-white/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Record Ad Play</DialogTitle>
            <DialogDescription className="text-slate-400">
              Record when an advertisement was played
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordPlay} className="space-y-4">
            <div>
              <Label className="text-slate-300">Advertisement *</Label>
              <Select
                value={recordPlayForm.advertisementId || "none"}
                onValueChange={(value) => {
                  const selectedAd = campaign?.advertisements.find((ad) => ad.id === value);
                  setRecordPlayForm({
                    ...recordPlayForm,
                    advertisementId: value === "none" ? "" : value,
                    playDuration: selectedAd?.duration?.toString() || recordPlayForm.playDuration,
                  });
                }}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select an advertisement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select an advertisement</SelectItem>
                  {campaign?.advertisements.map((ad) => (
                    <SelectItem key={ad.id} value={ad.id}>
                      {ad.title} ({ad.duration}s)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Duration Played (seconds) *</Label>
                <Input
                  type="number"
                  min="1"
                  max="600"
                  value={recordPlayForm.playDuration}
                  onChange={(e) => setRecordPlayForm({ ...recordPlayForm, playDuration: e.target.value })}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Play Status *</Label>
                <Select
                  value={recordPlayForm.playStatus}
                  onValueChange={(value) => setRecordPlayForm({ ...recordPlayForm, playStatus: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="SKIPPED">Skipped</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Program (Optional)</Label>
              <Select
                value={recordPlayForm.programId || "none"}
                onValueChange={(value) => setRecordPlayForm({ ...recordPlayForm, programId: value === "none" ? "" : value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific program</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                The program during which the ad was played
              </p>
            </div>

            <div>
              <Label className="text-slate-300">Presenter (Optional)</Label>
              <Select
                value={recordPlayForm.presenterId || "none"}
                onValueChange={(value) => setRecordPlayForm({ ...recordPlayForm, presenterId: value === "none" ? "" : value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select presenter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Current user</SelectItem>
                  {presenters.map((presenter) => (
                    <SelectItem key={presenter.id} value={presenter.id}>
                      {presenter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Who played the ad (defaults to you)
              </p>
            </div>

            <div>
              <Label className="text-slate-300">Notes (Optional)</Label>
              <Textarea
                value={recordPlayForm.notes}
                onChange={(e) => setRecordPlayForm({ ...recordPlayForm, notes: e.target.value })}
                placeholder="Any additional notes..."
                className="bg-white/5 border-white/10 text-white"
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={recordingPlay}
                onClick={() => {
                  setShowRecordPlayDialog(false);
                  setRecordPlayForm({
                    advertisementId: "",
                    playDuration: "",
                    programId: "",
                    presenterId: "",
                    playStatus: "COMPLETED",
                    notes: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!recordPlayForm.advertisementId || !recordPlayForm.playDuration || recordingPlay}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {recordingPlay ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Record Play
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
