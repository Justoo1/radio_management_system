"use client";

import { FeatureGuard } from "@/components/feature-guard";
import { Feature } from "@/lib/features";
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Package,
  Clock,
  Edit,
  Trash2,
  Play,
  Calendar,
  Sun,
  Sunset,
  Moon,
  BarChart3,
  Check,
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
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Link from "next/link";

interface AdDaypart {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  priceMultiplier: number;
  isActive: boolean;
  _count?: {
    packages: number;
    campaigns: number;
  };
}

interface Program {
  id: string;
  name: string;
}

interface AdPackage {
  id: string;
  name: string;
  description: string | null;
  packageType: "PLAY_COUNT" | "TIME_SLOT" | "PROGRAM_BASED" | "DAYPART";
  totalPlays: number | null;
  durationDays: number | null;
  playsPerDay: number | null;
  basePrice: number;
  currency: string;
  maxDuration: number;
  isActive: boolean;
  daypart: AdDaypart | null;
  program: Program | null;
  effectivePrice: number;
  calculatedPlays: number | null;
  pricePerPlay: number | null;
  _count: {
    campaigns: number;
  };
}

const PACKAGE_TYPES = [
  { value: "PLAY_COUNT", label: "Play Count", description: "Fixed number of plays" },
  { value: "TIME_SLOT", label: "Time Slot", description: "Daily plays over duration" },
  { value: "PROGRAM_BASED", label: "Program Based", description: "Tied to specific program" },
  { value: "DAYPART", label: "Daypart", description: "During specific time blocks" },
];

const DAYS_OF_WEEK = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

export default function PackagesPage() {
  return (
    <FeatureGuard
      feature={Feature.ADVERTISEMENTS}
      featureDescription="Manage advertising packages and dayparts for pricing"
    >
      <PackagesContent />
    </FeatureGuard>
  );
}

function PackagesContent() {
  const [activeTab, setActiveTab] = useState("packages");
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [dayparts, setDayparts] = useState<AdDaypart[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [packageTypeFilter, setPackageTypeFilter] = useState<string>("all");

  // Dialog states
  const [showPackageDialog, setShowPackageDialog] = useState(false);
  const [showDaypartDialog, setShowDaypartDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<AdPackage | null>(null);
  const [editingDaypart, setEditingDaypart] = useState<AdDaypart | null>(null);

  // Package form state
  const [packageForm, setPackageForm] = useState<{
    name: string;
    description: string;
    packageType: "PLAY_COUNT" | "TIME_SLOT" | "PROGRAM_BASED" | "DAYPART";
    totalPlays: string;
    durationDays: string;
    playsPerDay: string;
    basePrice: string;
    currency: string;
    daypartId: string;
    programId: string;
    maxDuration: string;
    isActive: boolean;
  }>({
    name: "",
    description: "",
    packageType: "PLAY_COUNT",
    totalPlays: "",
    durationDays: "",
    playsPerDay: "",
    basePrice: "",
    currency: "GHS",
    daypartId: "",
    programId: "",
    maxDuration: "60",
    isActive: true,
  });

  // Daypart form state
  const [daypartForm, setDaypartForm] = useState({
    name: "",
    startTime: "06:00",
    endTime: "10:00",
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true,
    priceMultiplier: "1.0",
    isActive: true,
  });

  // Stats
  const [stats, setStats] = useState({
    totalPackages: 0,
    activePackages: 0,
    totalDayparts: 0,
    activeDayparts: 0,
    totalCampaignsUsingPackages: 0,
  });

  // Fetch packages
  const fetchPackages = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (packageTypeFilter !== "all") params.set("packageType", packageTypeFilter);

      const response = await fetch(`/api/ads/packages?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setPackages(data.data || []);
        updateStats(data.data || [], dayparts);
      } else {
        toast.error(data.error || "Failed to fetch packages");
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Failed to fetch packages");
    }
  };

  // Fetch dayparts
  const fetchDayparts = async () => {
    try {
      const response = await fetch("/api/ads/dayparts");
      const data = await response.json();

      if (response.ok) {
        setDayparts(data.data || []);
        updateStats(packages, data.data || []);
      } else {
        toast.error(data.error || "Failed to fetch dayparts");
      }
    } catch (error) {
      console.error("Error fetching dayparts:", error);
      toast.error("Failed to fetch dayparts");
    }
  };

  // Fetch programs for package form
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

  const updateStats = (pkgs: AdPackage[], dps: AdDaypart[]) => {
    const activePackages = pkgs.filter((p) => p.isActive).length;
    const activeDayparts = dps.filter((d) => d.isActive).length;
    const totalCampaigns = pkgs.reduce((sum, p) => sum + (p._count?.campaigns || 0), 0);

    setStats({
      totalPackages: pkgs.length,
      activePackages,
      totalDayparts: dps.length,
      activeDayparts,
      totalCampaignsUsingPackages: totalCampaigns,
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPackages(), fetchDayparts(), fetchPrograms()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchPackages();
    }
  }, [search, packageTypeFilter]);

  // Create/Update Package
  const handleSubmitPackage = async (e: React.FormEvent) => {
    e.preventDefault();

    const packageData: any = {
      name: packageForm.name,
      description: packageForm.description || undefined,
      packageType: packageForm.packageType,
      basePrice: parseFloat(packageForm.basePrice),
      currency: packageForm.currency,
      maxDuration: parseInt(packageForm.maxDuration),
      isActive: packageForm.isActive,
    };

    // Add type-specific fields
    if (packageForm.packageType === "PLAY_COUNT") {
      packageData.totalPlays = parseInt(packageForm.totalPlays);
    } else if (packageForm.packageType === "TIME_SLOT") {
      packageData.durationDays = parseInt(packageForm.durationDays);
      packageData.playsPerDay = parseInt(packageForm.playsPerDay);
    }

    if (packageForm.daypartId) {
      packageData.daypartId = packageForm.daypartId;
    }

    if (packageForm.programId) {
      packageData.programId = packageForm.programId;
    }

    try {
      const url = editingPackage
        ? `/api/ads/packages/${editingPackage.id}`
        : "/api/ads/packages";
      const method = editingPackage ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packageData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          editingPackage ? "Package updated successfully!" : "Package created successfully!"
        );
        setShowPackageDialog(false);
        resetPackageForm();
        fetchPackages();
      } else {
        toast.error(data.error || "Failed to save package");
      }
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Failed to save package");
    }
  };

  // Create/Update Daypart
  const handleSubmitDaypart = async (e: React.FormEvent) => {
    e.preventDefault();

    const daypartData = {
      name: daypartForm.name,
      startTime: daypartForm.startTime,
      endTime: daypartForm.endTime,
      monday: daypartForm.monday,
      tuesday: daypartForm.tuesday,
      wednesday: daypartForm.wednesday,
      thursday: daypartForm.thursday,
      friday: daypartForm.friday,
      saturday: daypartForm.saturday,
      sunday: daypartForm.sunday,
      priceMultiplier: parseFloat(daypartForm.priceMultiplier),
      isActive: daypartForm.isActive,
    };

    try {
      const url = editingDaypart
        ? `/api/ads/dayparts/${editingDaypart.id}`
        : "/api/ads/dayparts";
      const method = editingDaypart ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(daypartData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          editingDaypart ? "Daypart updated successfully!" : "Daypart created successfully!"
        );
        setShowDaypartDialog(false);
        resetDaypartForm();
        fetchDayparts();
      } else {
        toast.error(data.error || "Failed to save daypart");
      }
    } catch (error) {
      console.error("Error saving daypart:", error);
      toast.error("Failed to save daypart");
    }
  };

  // Delete Package
  const handleDeletePackage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      const response = await fetch(`/api/ads/packages/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Package deleted successfully");
        fetchPackages();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete package");
      }
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package");
    }
  };

  // Delete Daypart
  const handleDeleteDaypart = async (id: string) => {
    if (!confirm("Are you sure you want to delete this daypart?")) return;

    try {
      const response = await fetch(`/api/ads/dayparts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Daypart deleted successfully");
        fetchDayparts();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete daypart");
      }
    } catch (error) {
      console.error("Error deleting daypart:", error);
      toast.error("Failed to delete daypart");
    }
  };

  const resetPackageForm = () => {
    setPackageForm({
      name: "",
      description: "",
      packageType: "PLAY_COUNT",
      totalPlays: "",
      durationDays: "",
      playsPerDay: "",
      basePrice: "",
      currency: "GHS",
      daypartId: "",
      programId: "",
      maxDuration: "60",
      isActive: true,
    });
    setEditingPackage(null);
  };

  const resetDaypartForm = () => {
    setDaypartForm({
      name: "",
      startTime: "06:00",
      endTime: "10:00",
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
      priceMultiplier: "1.0",
      isActive: true,
    });
    setEditingDaypart(null);
  };

  const openEditPackage = (pkg: AdPackage) => {
    setPackageForm({
      name: pkg.name,
      description: pkg.description || "",
      packageType: pkg.packageType,
      totalPlays: pkg.totalPlays?.toString() || "",
      durationDays: pkg.durationDays?.toString() || "",
      playsPerDay: pkg.playsPerDay?.toString() || "",
      basePrice: pkg.basePrice.toString(),
      currency: pkg.currency,
      daypartId: pkg.daypart?.id || "",
      programId: pkg.program?.id || "",
      maxDuration: pkg.maxDuration.toString(),
      isActive: pkg.isActive,
    });
    setEditingPackage(pkg);
    setShowPackageDialog(true);
  };

  const openEditDaypart = (daypart: AdDaypart) => {
    setDaypartForm({
      name: daypart.name,
      startTime: daypart.startTime,
      endTime: daypart.endTime,
      monday: daypart.monday,
      tuesday: daypart.tuesday,
      wednesday: daypart.wednesday,
      thursday: daypart.thursday,
      friday: daypart.friday,
      saturday: daypart.saturday,
      sunday: daypart.sunday,
      priceMultiplier: daypart.priceMultiplier.toString(),
      isActive: daypart.isActive,
    });
    setEditingDaypart(daypart);
    setShowDaypartDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return `GH₵ ${amount.toLocaleString()}`;
  };

  const getDaypartIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("morning") || nameLower.includes("dawn")) {
      return <Sun className="w-4 h-4 text-yellow-400" />;
    }
    if (nameLower.includes("evening") || nameLower.includes("prime")) {
      return <Sunset className="w-4 h-4 text-orange-400" />;
    }
    if (nameLower.includes("night") || nameLower.includes("overnight")) {
      return <Moon className="w-4 h-4 text-blue-400" />;
    }
    return <Clock className="w-4 h-4 text-purple-400" />;
  };

  const getPackageTypeLabel = (type: string) => {
    return PACKAGE_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/advertising"
                className="text-slate-400 hover:text-white transition"
              >
                Advertising
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-white">Packages & Pricing</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Packages & Dayparts
            </h1>
            <p className="text-slate-400">
              Manage pricing packages and time-based dayparts for advertising
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400 text-xs">Total Packages</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalPackages}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-1">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-slate-400 text-xs">Active Packages</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.activePackages}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400 text-xs">Total Dayparts</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalDayparts}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-400 text-xs">Active Dayparts</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.activeDayparts}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <span className="text-slate-400 text-xs">Campaigns Using</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalCampaignsUsingPackages}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/10 border border-white/20">
          <TabsTrigger value="packages" className="data-[state=active]:bg-purple-500/20">
            <Package className="w-4 h-4 mr-2" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="dayparts" className="data-[state=active]:bg-purple-500/20">
            <Clock className="w-4 h-4 mr-2" />
            Dayparts
          </TabsTrigger>
        </TabsList>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-6">
          {/* Filters */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 flex gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search packages..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
                  <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {PACKAGE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => {
                  resetPackageForm();
                  setShowPackageDialog(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Package
              </Button>
            </div>
          </div>

          {/* Packages Grid */}
          {loading ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 border border-white/20 text-center">
              <p className="text-slate-400">Loading packages...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 border border-white/20 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-purple-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  No Packages Yet
                </h3>
                <p className="text-slate-400 mb-6">
                  Create your first advertising package to offer clients
                  structured pricing options.
                </p>
                <Button
                  onClick={() => {
                    resetPackageForm();
                    setShowPackageDialog(true);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Package
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`bg-white/10 backdrop-blur-xl rounded-xl p-6 border ${
                    pkg.isActive ? "border-white/20" : "border-red-500/30"
                  } hover:border-purple-500/50 transition`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                        {!pkg.isActive && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                        {getPackageTypeLabel(pkg.packageType)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white"
                        onClick={() => openEditPackage(pkg)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDeletePackage(pkg.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  {pkg.description && (
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {pkg.description}
                    </p>
                  )}

                  {/* Pricing */}
                  <div className="bg-white/5 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Base Price</span>
                      <span className="text-white font-bold text-xl">
                        {formatCurrency(pkg.basePrice)}
                      </span>
                    </div>
                    {pkg.daypart && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">With {pkg.daypart.name}</span>
                        <span className="text-green-400 font-semibold">
                          {formatCurrency(pkg.effectivePrice)}
                        </span>
                      </div>
                    )}
                    {pkg.pricePerPlay && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-slate-400">Per Play</span>
                        <span className="text-blue-400">
                          {formatCurrency(Number(pkg.pricePerPlay.toFixed(2)))}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {pkg.packageType === "PLAY_COUNT" && pkg.totalPlays && (
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Play className="w-3 h-3 text-purple-400" />
                          <span className="text-slate-400 text-xs">Total Plays</span>
                        </div>
                        <p className="text-white font-semibold">{pkg.totalPlays}</p>
                      </div>
                    )}

                    {pkg.packageType === "TIME_SLOT" && (
                      <>
                        <div className="bg-white/5 rounded-lg p-2">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3 text-blue-400" />
                            <span className="text-slate-400 text-xs">Duration</span>
                          </div>
                          <p className="text-white font-semibold">{pkg.durationDays} days</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <div className="flex items-center gap-1 mb-1">
                            <Play className="w-3 h-3 text-green-400" />
                            <span className="text-slate-400 text-xs">Per Day</span>
                          </div>
                          <p className="text-white font-semibold">{pkg.playsPerDay} plays</p>
                        </div>
                      </>
                    )}

                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3 text-orange-400" />
                        <span className="text-slate-400 text-xs">Max Duration</span>
                      </div>
                      <p className="text-white font-semibold">{pkg.maxDuration}s</p>
                    </div>

                    {pkg.calculatedPlays && (
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <BarChart3 className="w-3 h-3 text-yellow-400" />
                          <span className="text-slate-400 text-xs">Total Plays</span>
                        </div>
                        <p className="text-white font-semibold">{pkg.calculatedPlays}</p>
                      </div>
                    )}
                  </div>

                  {/* Associated Items */}
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    {pkg.daypart && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                        {getDaypartIcon(pkg.daypart.name)}
                        {pkg.daypart.name}
                      </span>
                    )}
                    {pkg.program && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        📻 {pkg.program.name}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-slate-400 text-sm">
                      {pkg._count.campaigns} campaign{pkg._count.campaigns !== 1 ? "s" : ""}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {pkg.currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Dayparts Tab */}
        <TabsContent value="dayparts" className="space-y-6">
          {/* Add Daypart Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                resetDaypartForm();
                setShowDaypartDialog(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Daypart
            </Button>
          </div>

          {/* Dayparts List */}
          {dayparts.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 border border-white/20 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  No Dayparts Yet
                </h3>
                <p className="text-slate-400 mb-6">
                  Create dayparts to define time blocks with different pricing
                  multipliers (e.g., Prime Time, Morning Drive, Overnight).
                </p>
                <Button
                  onClick={() => {
                    resetDaypartForm();
                    setShowDaypartDialog(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Daypart
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dayparts.map((daypart) => (
                <div
                  key={daypart.id}
                  className={`bg-white/10 backdrop-blur-xl rounded-xl p-6 border ${
                    daypart.isActive ? "border-white/20" : "border-red-500/30"
                  } hover:border-blue-500/50 transition`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/10 p-3 rounded-lg">
                        {getDaypartIcon(daypart.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">{daypart.name}</h3>
                          {!daypart.isActive && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">
                          {daypart.startTime} - {daypart.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white"
                        onClick={() => openEditDaypart(daypart)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDeleteDaypart(daypart.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Price Multiplier */}
                  <div className="bg-white/5 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Price Multiplier</span>
                      <span className={`text-xl font-bold ${
                        daypart.priceMultiplier > 1 ? "text-green-400" :
                        daypart.priceMultiplier < 1 ? "text-yellow-400" : "text-white"
                      }`}>
                        {daypart.priceMultiplier}x
                      </span>
                    </div>
                  </div>

                  {/* Days Active */}
                  <div className="mb-4">
                    <p className="text-slate-400 text-sm mb-2">Active Days</p>
                    <div className="flex gap-1">
                      {DAYS_OF_WEEK.map((day) => (
                        <div
                          key={day.key}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold ${
                            daypart[day.key as keyof AdDaypart]
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-white/5 text-slate-600"
                          }`}
                        >
                          {day.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                    <span className="text-slate-400 text-sm">
                      {daypart._count?.packages || 0} package{(daypart._count?.packages || 0) !== 1 ? "s" : ""}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 text-sm">
                      {daypart._count?.campaigns || 0} campaign{(daypart._count?.campaigns || 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Package Dialog */}
      <Dialog open={showPackageDialog} onOpenChange={setShowPackageDialog}>
        <DialogContent className="bg-slate-900 border-white/20 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingPackage ? "Edit Package" : "Create Package"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingPackage
                ? "Update the advertising package details"
                : "Create a new advertising package for clients"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPackage} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-300">Package Name *</Label>
                <Input
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  required
                  placeholder="e.g., 50 Play Package"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="col-span-2">
                <Label className="text-slate-300">Description</Label>
                <Textarea
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  placeholder="Package description..."
                  className="bg-white/5 border-white/10 text-white"
                  rows={2}
                />
              </div>

              <div>
                <Label className="text-slate-300">Package Type *</Label>
                <Select
                  value={packageForm.packageType}
                  onValueChange={(value: any) => setPackageForm({ ...packageForm, packageType: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div>{type.label}</div>
                          <div className="text-xs text-slate-400">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Base Price (GH₵) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={packageForm.basePrice}
                  onChange={(e) => setPackageForm({ ...packageForm, basePrice: e.target.value })}
                  required
                  placeholder="2000"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              {/* Type-specific fields */}
              {packageForm.packageType === "PLAY_COUNT" && (
                <div>
                  <Label className="text-slate-300">Total Plays *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={packageForm.totalPlays}
                    onChange={(e) => setPackageForm({ ...packageForm, totalPlays: e.target.value })}
                    required
                    placeholder="50"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              )}

              {packageForm.packageType === "TIME_SLOT" && (
                <>
                  <div>
                    <Label className="text-slate-300">Duration (Days) *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={packageForm.durationDays}
                      onChange={(e) => setPackageForm({ ...packageForm, durationDays: e.target.value })}
                      required
                      placeholder="7"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Plays Per Day *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={packageForm.playsPerDay}
                      onChange={(e) => setPackageForm({ ...packageForm, playsPerDay: e.target.value })}
                      required
                      placeholder="5"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </>
              )}

              <div>
                <Label className="text-slate-300">Max Ad Duration (seconds)</Label>
                <Input
                  type="number"
                  min="5"
                  max="300"
                  value={packageForm.maxDuration}
                  onChange={(e) => setPackageForm({ ...packageForm, maxDuration: e.target.value })}
                  placeholder="60"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Daypart (Optional)</Label>
                <Select
                  value={packageForm.daypartId || "none"}
                  onValueChange={(value) => setPackageForm({ ...packageForm, daypartId: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select daypart" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {dayparts.filter((d) => d.isActive).map((daypart) => (
                      <SelectItem key={daypart.id} value={daypart.id}>
                        {daypart.name} ({daypart.priceMultiplier}x)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(packageForm.packageType === "PROGRAM_BASED" || packageForm.packageType === "DAYPART") && (
                <div>
                  <Label className="text-slate-300">Program (Optional)</Label>
                  <Select
                    value={packageForm.programId || "none"}
                    onValueChange={(value) => setPackageForm({ ...packageForm, programId: value === "none" ? "" : value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="col-span-2 flex items-center gap-3">
                <Switch
                  id="package-active"
                  checked={packageForm.isActive}
                  onCheckedChange={(checked) => setPackageForm({ ...packageForm, isActive: checked })}
                />
                <Label htmlFor="package-active" className="text-slate-300">
                  Package is active and available for selection
                </Label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPackageDialog(false);
                  resetPackageForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingPackage ? "Update Package" : "Create Package"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Daypart Dialog */}
      <Dialog open={showDaypartDialog} onOpenChange={setShowDaypartDialog}>
        <DialogContent className="bg-slate-900 border-white/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingDaypart ? "Edit Daypart" : "Create Daypart"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingDaypart
                ? "Update the daypart time block"
                : "Define a time block for pricing differentiation"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitDaypart} className="space-y-4">
            <div>
              <Label className="text-slate-300">Daypart Name *</Label>
              <Input
                value={daypartForm.name}
                onChange={(e) => setDaypartForm({ ...daypartForm, name: e.target.value })}
                required
                placeholder="e.g., Prime Time, Morning Drive"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Start Time *</Label>
                <Input
                  type="time"
                  value={daypartForm.startTime}
                  onChange={(e) => setDaypartForm({ ...daypartForm, startTime: e.target.value })}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">End Time *</Label>
                <Input
                  type="time"
                  value={daypartForm.endTime}
                  onChange={(e) => setDaypartForm({ ...daypartForm, endTime: e.target.value })}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Price Multiplier *</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={daypartForm.priceMultiplier}
                onChange={(e) => setDaypartForm({ ...daypartForm, priceMultiplier: e.target.value })}
                required
                placeholder="1.5"
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">
                1.0 = normal price, 1.5 = 50% premium, 0.8 = 20% discount
              </p>
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Active Days</Label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() =>
                      setDaypartForm({
                        ...daypartForm,
                        [day.key]: !daypartForm[day.key as keyof typeof daypartForm],
                      })
                    }
                    className={`w-10 h-10 rounded-lg text-xs font-semibold transition ${
                      daypartForm[day.key as keyof typeof daypartForm]
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                        : "bg-white/5 text-slate-500 border border-white/10"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="daypart-active"
                checked={daypartForm.isActive}
                onCheckedChange={(checked) => setDaypartForm({ ...daypartForm, isActive: checked })}
              />
              <Label htmlFor="daypart-active" className="text-slate-300">
                Daypart is active
              </Label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDaypartDialog(false);
                  resetDaypartForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingDaypart ? "Update Daypart" : "Create Daypart"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
