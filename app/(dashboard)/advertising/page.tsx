"use client";

import { FeatureGuard } from "@/components/feature-guard";
import { Feature } from "@/lib/features";
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Calendar,
  DollarSign,
  BarChart3,
  Play,
  Pause,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Clock,
  Users,
  Target,
  Package,
  Settings,
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
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AdDaypart {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  priceMultiplier: number;
  isActive: boolean;
}

interface Program {
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
  effectivePrice: number;
  calculatedPlays: number | null;
  daypart?: {
    id: string;
    name: string;
    priceMultiplier: number;
  };
}

const SCHEDULE_TYPES = [
  { value: "TIME_SLOT", label: "Time Slot", description: "Scheduled at specific times" },
  { value: "FLEXIBLE", label: "Flexible", description: "Play anytime during campaign" },
  { value: "PROGRAM_BASED", label: "Program Based", description: "During specific programs" },
  { value: "DAYPART_BASED", label: "Daypart Based", description: "During specific dayparts" },
];

interface AdCampaign {
  id: string;
  name: string;
  description: string | null;
  budget: number | null;
  startDate: string;
  endDate: string;
  status: string;
  scheduleType?: string;
  targetPlays?: number;
  completedPlays?: number;
  actualPlays?: number;
  totalPlays?: number;
  totalAds?: number;
  fulfillmentStatus?: string;
  client: Client;
  package?: AdPackage | null;
  advertisements: Array<{
    id: string;
    title: string;
    duration: number;
    totalPlays?: number;
    playCount?: number;
  }>;
  totalScheduledPlays?: number;
  totalActualPlays?: number;
  fulfillmentRate?: number;
  _count?: {
    advertisements: number;
    adSlots?: number;
    invoices?: number;
  };
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", color: "gray" },
  { value: "ACTIVE", label: "Active", color: "green" },
  { value: "PAUSED", label: "Paused", color: "yellow" },
  { value: "COMPLETED", label: "Completed", color: "blue" },
  { value: "CANCELLED", label: "Cancelled", color: "red" },
];

export default function AdvertisingPage() {
  return (
    <FeatureGuard
      feature={Feature.ADVERTISEMENTS}
      featureDescription="Manage advertising campaigns, track ad performance, and maximize revenue"
    >
      <AdvertisingContent />
    </FeatureGuard>
  );
}

function AdvertisingContent() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [dayparts, setDayparts] = useState<AdDaypart[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(
    null
  );

  // Form state for create campaign
  const [formData, setFormData] = useState({
    clientId: "",
    status: "PENDING",
    packageId: "",
    scheduleType: "TIME_SLOT",
    targetDaypartId: "",
    targetProgramId: "",
  });

  // Form state for edit campaign
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    budget: "",
    startDate: "",
    endDate: "",
    status: "PENDING",
    scheduleType: "TIME_SLOT",
    targetPlays: "",
    targetDaypartId: "",
    targetProgramId: "",
  });

  // Stats
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    scheduledCampaigns: 0,
    totalRevenue: 0,
    totalImpressions: 0,
  });

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/ads/campaigns?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setCampaigns(data.data || []);
        calculateStats(data.data || []);
      } else {
        toast.error(data.error || "Failed to fetch campaigns");
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients for the create form
  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      const data = await response.json();

      if (response.ok) {
        setClients(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // Fetch packages for the create form
  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/ads/packages?isActive=true");
      const data = await response.json();

      if (response.ok) {
        setPackages(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };

  // Fetch dayparts for the create form
  const fetchDayparts = async () => {
    try {
      const response = await fetch("/api/ads/dayparts?isActive=true");
      const data = await response.json();

      if (response.ok) {
        setDayparts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching dayparts:", error);
    }
  };

  // Fetch programs for the create form
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

  const calculateStats = (campaignsData: AdCampaign[]) => {
    const active = campaignsData.filter((c) => c.status === "ACTIVE").length;
    const scheduled = campaignsData.filter((c) => c.status === "PENDING").length;
    const revenue = campaignsData.reduce((sum, c) => sum + Number(c.budget || 0), 0);
    const impressions = campaignsData.reduce(
      (sum, c) => sum + (c.totalPlays ?? c.actualPlays ?? 0),
      0
    );

    setStats({
      activeCampaigns: active,
      scheduledCampaigns: scheduled,
      totalRevenue: revenue,
      totalImpressions: impressions,
    });
  };

  useEffect(() => {
    fetchCampaigns();
    fetchClients();
    fetchPackages();
    fetchDayparts();
    fetchPrograms();
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [search, statusFilter]);

  // Create campaign
  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const targetPlaysValue = form.get("targetPlays") as string;
    const budgetValue = form.get("budget") as string;

    const campaignData: any = {
      clientId: formData.clientId,
      name: form.get("name") as string,
      description: form.get("description") as string,
      startDate: new Date(form.get("startDate") as string).toISOString(),
      endDate: new Date(form.get("endDate") as string).toISOString(),
      status: formData.status,
      scheduleType: formData.scheduleType,
    };

    if (budgetValue) {
      campaignData.budget = parseFloat(budgetValue);
    }

    if (targetPlaysValue) {
      campaignData.targetPlays = parseInt(targetPlaysValue);
    }

    if (formData.packageId) {
      campaignData.packageId = formData.packageId;
      // If using a package, auto-set target plays from package
      const selectedPackage = packages.find((p) => p.id === formData.packageId);
      if (selectedPackage?.calculatedPlays && !targetPlaysValue) {
        campaignData.targetPlays = selectedPackage.calculatedPlays;
      }
    }

    // Add targetDaypartId for DAYPART_BASED schedule type
    if (formData.scheduleType === "DAYPART_BASED" && formData.targetDaypartId) {
      campaignData.targetDaypartId = formData.targetDaypartId;
    }

    // Add targetProgramId for PROGRAM_BASED schedule type
    if (formData.scheduleType === "PROGRAM_BASED" && formData.targetProgramId) {
      campaignData.targetProgramId = formData.targetProgramId;
    }

    try {
      const response = await fetch("/api/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Campaign created successfully!");
        setShowCreateDialog(false);
        setFormData({ clientId: "", status: "PENDING", packageId: "", scheduleType: "TIME_SLOT", targetDaypartId: "", targetProgramId: "" });
        fetchCampaigns();
      } else {
        toast.error(data.error || "Failed to create campaign");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign");
    }
  };

  // Delete campaign
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const response = await fetch(`/api/ads/campaigns/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Campaign deleted successfully");
        fetchCampaigns();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete campaign");
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign");
    }
  };

  // Open edit dialog with campaign data
  const openEditDialog = (campaign: AdCampaign) => {
    setSelectedCampaign(campaign);
    setEditFormData({
      name: campaign.name,
      description: campaign.description || "",
      budget: campaign.budget?.toString() || "",
      startDate: campaign.startDate.split("T")[0],
      endDate: campaign.endDate.split("T")[0],
      status: campaign.status,
      scheduleType: campaign.scheduleType || "TIME_SLOT",
      targetPlays: campaign.targetPlays?.toString() || "",
      targetDaypartId: "",
      targetProgramId: "",
    });
    setShowEditDialog(true);
  };

  // Update campaign
  const handleUpdateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedCampaign) return;

    const updateData: any = {
      name: editFormData.name,
      description: editFormData.description || undefined,
      startDate: new Date(editFormData.startDate).toISOString(),
      endDate: new Date(editFormData.endDate).toISOString(),
      status: editFormData.status,
      scheduleType: editFormData.scheduleType,
    };

    if (editFormData.budget) {
      updateData.budget = parseFloat(editFormData.budget);
    }

    if (editFormData.targetPlays) {
      updateData.targetPlays = parseInt(editFormData.targetPlays);
    }

    // Add targetDaypartId for DAYPART_BASED schedule type
    if (editFormData.scheduleType === "DAYPART_BASED" && editFormData.targetDaypartId) {
      updateData.targetDaypartId = editFormData.targetDaypartId;
    }

    // Add targetProgramId for PROGRAM_BASED schedule type
    if (editFormData.scheduleType === "PROGRAM_BASED" && editFormData.targetProgramId) {
      updateData.targetProgramId = editFormData.targetProgramId;
    }

    try {
      const response = await fetch(`/api/ads/campaigns/${selectedCampaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Campaign updated successfully!");
        setShowEditDialog(false);
        setSelectedCampaign(null);
        fetchCampaigns();
      } else {
        toast.error(data.error || "Failed to update campaign");
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error("Failed to update campaign");
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    return statusOption?.color || "gray";
  };

  const getStatusBadgeClass = (status: string) => {
    const colors: { [key: string]: string } = {
      gray: "bg-gray-500/20 text-gray-300",
      green: "bg-green-500/20 text-green-300",
      yellow: "bg-yellow-500/20 text-yellow-300",
      blue: "bg-blue-500/20 text-blue-300",
      red: "bg-red-500/20 text-red-300",
    };
    return colors[getStatusColor(status)] || colors.gray;
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

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Advertising Management
            </h1>
            <p className="text-slate-400">
              Manage ad campaigns and track performance
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/advertising/analytics">
              <button className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition border border-white/20">
                <BarChart3 className="w-5 h-5" />
                Analytics
              </button>
            </Link>
            <Link href="/advertising/packages">
              <button className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition border border-white/20">
                <Package className="w-5 h-5" />
                Packages
              </button>
            </Link>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition shadow-lg shadow-purple-500/30"
            >
              <Plus className="w-5 h-5" />
              New Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <Play className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-slate-400 text-sm">Active Campaigns</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.activeCampaigns}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-400 text-sm">Pending Campaigns</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.scheduledCampaigns}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Budget</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Plays</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.totalImpressions.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === "all"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              All
            </button>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status.value
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 border border-white/20 text-center">
          <p className="text-slate-400">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 border border-white/20 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-purple-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              No Ad Campaigns Yet
            </h3>
            <p className="text-slate-400 mb-6">
              Create your first advertising campaign to start generating
              revenue. Track performance, manage ad slots, and optimize your
              advertising strategy.
            </p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition shadow-lg shadow-purple-500/30"
            >
              <Plus className="w-5 h-5" />
              Create First Campaign
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {campaign.name}
                  </h3>
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {campaign.client.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                      campaign.status
                    )}`}
                  >
                    {STATUS_OPTIONS.find((s) => s.value === campaign.status)
                      ?.label || campaign.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              {campaign.description && (
                <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                  {campaign.description}
                </p>
              )}

              {/* Package Info */}
              {campaign.package && (
                <div className="mb-4 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-300 text-sm font-medium">{campaign.package.name}</span>
                    <span className="text-purple-400/70 text-xs">
                      • GH₵ {Number(campaign.package.effectivePrice || campaign.package.basePrice).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400 text-xs">Target Plays</span>
                  </div>
                  <p className="text-white font-semibold">
                    {campaign.targetPlays?.toLocaleString() || "∞"}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Play className="w-4 h-4 text-green-400" />
                    <span className="text-slate-400 text-xs">Completed</span>
                  </div>
                  <p className="text-white font-semibold">
                    {(campaign.completedPlays ?? campaign.totalPlays ?? campaign.actualPlays ?? 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                    <span className="text-slate-400 text-xs">Budget</span>
                  </div>
                  <p className="text-white font-semibold">
                    {campaign.budget ? formatCurrency(Number(campaign.budget)) : "Package"}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-orange-400" />
                    <span className="text-slate-400 text-xs">Ads</span>
                  </div>
                  <p className="text-white font-semibold">
                    {(campaign.totalAds ?? campaign._count?.advertisements ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Fulfillment Progress */}
              {campaign.targetPlays && campaign.targetPlays > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Fulfillment</span>
                    <span>
                      {Math.round(((campaign.completedPlays || 0) / campaign.targetPlays) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        (campaign.completedPlays || 0) >= campaign.targetPlays
                          ? "bg-green-500"
                          : "bg-gradient-to-r from-purple-500 to-pink-500"
                      }`}
                      style={{
                        width: `${Math.min(100, ((campaign.completedPlays || 0) / campaign.targetPlays) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Campaign Duration */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Campaign Duration</span>
                  <span>
                    {Math.ceil((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(Math.max(0, (Date.now() - new Date(campaign.startDate).getTime()) / (new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) * 100), 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(campaign.startDate)}</span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-2">
                  <span>{formatDate(campaign.endDate)}</span>
                </div>
              </div>

              {/* Footer Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex gap-4 text-sm text-slate-400">
                  <span>{campaign._count?.advertisements ?? campaign.totalAds ?? 0} ads</span>
                  <span>{campaign.advertisements?.length ?? 0} active</span>
                </div>

                <div className="flex gap-2">
                  <Link href={`/advertising/${campaign.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                    onClick={() => openEditDialog(campaign)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleDelete(campaign.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-white/20 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Create Ad Campaign</DialogTitle>
            <DialogDescription className="text-slate-400">
              Set up a new advertising campaign for your client
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <Label className="text-slate-300">Client *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.clientId && (
                <p className="text-xs text-red-400 mt-1">Client is required</p>
              )}
            </div>

            <div>
              <Label className="text-slate-300">Campaign Name</Label>
              <Input
                name="name"
                required
                placeholder="e.g., Coca-Cola Summer 2026"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                name="description"
                placeholder="Campaign description..."
                className="bg-white/5 border-white/10 text-white"
                rows={3}
              />
            </div>

            {/* Package Selection */}
            <div>
              <Label className="text-slate-300">Package (Optional)</Label>
              <Select
                value={formData.packageId || "none"}
                onValueChange={(value) => setFormData({ ...formData, packageId: value === "none" ? "" : value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a package (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No package</SelectItem>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      <div className="flex flex-col">
                        <span>{pkg.name}</span>
                        <span className="text-xs text-slate-400">
                          GH₵ {pkg.effectivePrice.toLocaleString()} • {pkg.calculatedPlays || pkg.totalPlays || "Unlimited"} plays
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.packageId && (
                <p className="text-xs text-green-400 mt-1">
                  Package pricing will be used for invoicing
                </p>
              )}
            </div>

            {/* Schedule Type */}
            <div>
              <Label className="text-slate-300">Schedule Type</Label>
              <Select
                value={formData.scheduleType}
                onValueChange={(value) => setFormData({ ...formData, scheduleType: value, targetDaypartId: "", targetProgramId: "" })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <span>{type.label}</span>
                        <span className="text-xs text-slate-400 ml-2">- {type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conditional: Target Daypart (for DAYPART_BASED) */}
            {formData.scheduleType === "DAYPART_BASED" && (
              <div>
                <Label className="text-slate-300">Target Daypart *</Label>
                <Select
                  value={formData.targetDaypartId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, targetDaypartId: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a daypart" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a daypart</SelectItem>
                    {dayparts.map((daypart) => (
                      <SelectItem key={daypart.id} value={daypart.id}>
                        <div className="flex flex-col">
                          <span>{daypart.name}</span>
                          <span className="text-xs text-slate-400">
                            {daypart.startTime} - {daypart.endTime} ({daypart.priceMultiplier}x)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.targetDaypartId && (
                  <p className="text-xs text-red-400 mt-1">Daypart is required for daypart-based scheduling</p>
                )}
                {dayparts.length === 0 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    No dayparts available. <Link href="/advertising/packages" className="underline">Create dayparts first</Link>
                  </p>
                )}
              </div>
            )}

            {/* Conditional: Target Program (for PROGRAM_BASED) */}
            {formData.scheduleType === "PROGRAM_BASED" && (
              <div>
                <Label className="text-slate-300">Target Program *</Label>
                <Select
                  value={formData.targetProgramId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, targetProgramId: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a program</SelectItem>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.targetProgramId && (
                  <p className="text-xs text-red-400 mt-1">Program is required for program-based scheduling</p>
                )}
                {programs.length === 0 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    No programs available. <Link href="/programs" className="underline">Create programs first</Link>
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Budget (GH₵)</Label>
                <Input
                  name="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="50000"
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-slate-500 mt-1">Optional if using a package</p>
              </div>

              <div>
                <Label className="text-slate-300">Target Plays</Label>
                <Input
                  name="targetPlays"
                  type="number"
                  min="1"
                  placeholder={formData.packageId ? "Auto from package" : "150"}
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.packageId ? "Leave empty to use package plays" : "Required without package"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Start Date *</Label>
                <Input
                  name="startDate"
                  type="date"
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">End Date *</Label>
                <Input
                  name="endDate"
                  type="date"
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setFormData({ clientId: "", status: "PENDING", packageId: "", scheduleType: "TIME_SLOT", targetDaypartId: "", targetProgramId: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !formData.clientId ||
                  (formData.scheduleType === "DAYPART_BASED" && !formData.targetDaypartId) ||
                  (formData.scheduleType === "PROGRAM_BASED" && !formData.targetProgramId)
                }
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Campaign
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) setSelectedCampaign(null);
      }}>
        <DialogContent className="bg-slate-900 border-white/20 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Campaign</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update campaign details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateCampaign} className="space-y-4">
            <div>
              <Label className="text-slate-300">Campaign Name *</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                placeholder="e.g., Coca-Cola Summer 2026"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Campaign description..."
                className="bg-white/5 border-white/10 text-white"
                rows={3}
              />
            </div>

            {/* Schedule Type */}
            <div>
              <Label className="text-slate-300">Schedule Type</Label>
              <Select
                value={editFormData.scheduleType}
                onValueChange={(value) => setEditFormData({ ...editFormData, scheduleType: value, targetDaypartId: "", targetProgramId: "" })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <span>{type.label}</span>
                        <span className="text-xs text-slate-400 ml-2">- {type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conditional: Target Daypart (for DAYPART_BASED) */}
            {editFormData.scheduleType === "DAYPART_BASED" && (
              <div>
                <Label className="text-slate-300">Target Daypart *</Label>
                <Select
                  value={editFormData.targetDaypartId || "none"}
                  onValueChange={(value) => setEditFormData({ ...editFormData, targetDaypartId: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a daypart" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a daypart</SelectItem>
                    {dayparts.map((daypart) => (
                      <SelectItem key={daypart.id} value={daypart.id}>
                        <div className="flex flex-col">
                          <span>{daypart.name}</span>
                          <span className="text-xs text-slate-400">
                            {daypart.startTime} - {daypart.endTime} ({daypart.priceMultiplier}x)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!editFormData.targetDaypartId && (
                  <p className="text-xs text-red-400 mt-1">Daypart is required for daypart-based scheduling</p>
                )}
              </div>
            )}

            {/* Conditional: Target Program (for PROGRAM_BASED) */}
            {editFormData.scheduleType === "PROGRAM_BASED" && (
              <div>
                <Label className="text-slate-300">Target Program *</Label>
                <Select
                  value={editFormData.targetProgramId || "none"}
                  onValueChange={(value) => setEditFormData({ ...editFormData, targetProgramId: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a program</SelectItem>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!editFormData.targetProgramId && (
                  <p className="text-xs text-red-400 mt-1">Program is required for program-based scheduling</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Budget (GH₵)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.budget}
                  onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                  placeholder="50000"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Target Plays</Label>
                <Input
                  type="number"
                  min="1"
                  value={editFormData.targetPlays}
                  onChange={(e) => setEditFormData({ ...editFormData, targetPlays: e.target.value })}
                  placeholder="150"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Start Date *</Label>
                <Input
                  type="date"
                  value={editFormData.startDate}
                  onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">End Date *</Label>
                <Input
                  type="date"
                  value={editFormData.endDate}
                  onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedCampaign(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !editFormData.name ||
                  (editFormData.scheduleType === "DAYPART_BASED" && !editFormData.targetDaypartId) ||
                  (editFormData.scheduleType === "PROGRAM_BASED" && !editFormData.targetProgramId)
                }
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Campaign
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
