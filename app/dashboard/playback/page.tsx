"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { 
  Play, 
  Clock, 
  Monitor, 
  FileImage, 
  PlayCircle, 
  Download,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  Activity,
  Zap,
  ChevronDown,
  Search,
  X,
} from "lucide-react";

interface PlaybackSummary {
  total_plays: number;
  total_duration: number;
  unique_devices: number;
  unique_assets: number;
  unique_playlists: number;
  date_range: {
    from: string | null;
    to: string | null;
  };
  filters: any;
}

interface AssetReport {
  asset_id: string;
  play_count: number;
  total_duration: number;
  avg_duration: number;
  first_played: string;
  last_played: string;
}

interface DeviceReport {
  device_id: string;
  play_count: number;
  total_duration: number;
  unique_assets: number;
  avg_duration: number;
  first_played: string;
  last_played: string;
}

interface PlaylistReport {
  playlist_id: string;
  play_count: number;
  total_duration: number;
  unique_assets: number;
  unique_devices: number;
  avg_duration: number;
  first_played: string;
  last_played: string;
}

interface ReportData {
  summary: PlaybackSummary;
  by_asset: AssetReport[];
  by_device: DeviceReport[];
  by_playlist: PlaylistReport[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[hsl(222,47%,11%)] border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-white/70">
            {entry.name}: <span className="text-white font-medium">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient,
}: { 
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <div className="stat-card group">
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-3xl group-hover:opacity-30 transition-opacity duration-500`} />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-white/50">{title}</p>
          <p className="text-3xl font-bold text-white counter">{value}</p>
          {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default function PlaybackAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    device_id: "",
    asset_id: "",
    playlist_id: "",
    date_from: "",
    date_to: "",
  });
  
  const [activeTab, setActiveTab] = useState<"assets" | "devices" | "playlists">("assets");

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim()) params.append(key, value.trim());
      });
      
      const response = await fetch(`/api/playback/report?${params.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to fetch report: ${response.statusText}`);
      }
      
      const reportData = await response.json();
      setData(reportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchReport();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      device_id: "",
      asset_id: "",
      playlist_id: "",
      date_from: "",
      date_to: "",
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToCSV = () => {
    if (!data) return;
    
    let csvContent = "";
    let headers = [];
    let rows: any[] = [];
    
    if (activeTab === "assets") {
      headers = ["Asset ID", "Play Count", "Total Duration (s)", "Avg Duration (s)", "First Played", "Last Played"];
      rows = data.by_asset.map(asset => [
        asset.asset_id,
        asset.play_count,
        asset.total_duration,
        asset.avg_duration.toFixed(2),
        formatDate(asset.first_played),
        formatDate(asset.last_played)
      ]);
    } else if (activeTab === "devices") {
      headers = ["Device ID", "Play Count", "Total Duration (s)", "Unique Assets", "Avg Duration (s)", "Last Played"];
      rows = data.by_device.map(device => [
        device.device_id,
        device.play_count,
        device.total_duration,
        device.unique_assets,
        device.avg_duration.toFixed(2),
        formatDate(device.last_played)
      ]);
    } else {
      headers = ["Playlist ID", "Play Count", "Total Duration (s)", "Unique Assets", "Unique Devices", "Last Played"];
      rows = data.by_playlist.map(playlist => [
        playlist.playlist_id,
        playlist.play_count,
        playlist.total_duration,
        playlist.unique_assets,
        playlist.unique_devices,
        formatDate(playlist.last_played)
      ]);
    }
    
    csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playback-report-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Chart colors matching our theme
  const CHART_COLORS = [
    'hsl(263, 70%, 50%)',
    'hsl(330, 81%, 60%)',
    'hsl(199, 89%, 48%)',
    'hsl(142, 76%, 36%)',
    'hsl(38, 92%, 50%)',
    'hsl(280, 70%, 50%)',
    'hsl(190, 80%, 45%)',
    'hsl(350, 70%, 55%)',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <p className="text-white/50">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-red-400 font-medium">{error}</p>
          <Button onClick={fetchReport} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-white/30" />
          </div>
          <p className="text-white/50">No playback data available</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const topAssetsChartData = data.by_asset.slice(0, 8).map(asset => ({
    name: asset.asset_id.length > 15 ? asset.asset_id.substring(0, 15) + "..." : asset.asset_id,
    plays: asset.play_count,
    duration: Math.round(asset.total_duration / 60),
  }));

  const deviceDistributionData = data.by_device.slice(0, 6).map((device, index) => ({
    name: device.device_id.length > 12 ? device.device_id.substring(0, 12) + "..." : device.device_id,
    value: device.play_count,
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Playback Analytics
          </h1>
          <p className="text-white/50">
            Proof-of-play reporting and insights for your network
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant="outline"
            className="border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {Object.values(filters).some(v => v) && (
              <span className="ml-2 w-2 h-2 rounded-full bg-violet-500" />
            )}
          </Button>
          <Button 
            onClick={fetchReport} 
            variant="outline"
            className="border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={exportToCSV}
            className="bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label className="text-white/60 text-sm">Device ID</Label>
              <Input
                value={filters.device_id}
                onChange={(e) => handleFilterChange("device_id", e.target.value)}
                placeholder="Filter by device..."
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <Label className="text-white/60 text-sm">Asset ID</Label>
              <Input
                value={filters.asset_id}
                onChange={(e) => handleFilterChange("asset_id", e.target.value)}
                placeholder="Filter by asset..."
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <Label className="text-white/60 text-sm">Playlist ID</Label>
              <Input
                value={filters.playlist_id}
                onChange={(e) => handleFilterChange("playlist_id", e.target.value)}
                placeholder="Filter by playlist..."
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <Label className="text-white/60 text-sm">From Date</Label>
              <Input
                type="datetime-local"
                value={filters.date_from}
                onChange={(e) => handleFilterChange("date_from", e.target.value)}
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/60 text-sm">To Date</Label>
              <Input
                type="datetime-local"
                value={filters.date_to}
                onChange={(e) => handleFilterChange("date_to", e.target.value)}
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={applyFilters} className="bg-gradient-to-r from-violet-500 to-pink-500">
              Apply Filters
            </Button>
            <Button onClick={clearFilters} variant="outline" className="border-white/10 text-white/70">
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Plays"
          value={data.summary.total_plays.toLocaleString()}
          icon={Play}
          gradient="from-violet-500 to-purple-500"
        />
        <StatCard
          title="Total Duration"
          value={formatDuration(data.summary.total_duration)}
          icon={Clock}
          gradient="from-cyan-500 to-blue-500"
        />
        <StatCard
          title="Active Devices"
          value={data.summary.unique_devices}
          icon={Monitor}
          gradient="from-emerald-500 to-green-500"
        />
        <StatCard
          title="Unique Assets"
          value={data.summary.unique_assets}
          icon={FileImage}
          gradient="from-pink-500 to-rose-500"
        />
        <StatCard
          title="Active Playlists"
          value={data.summary.unique_playlists}
          icon={PlayCircle}
          gradient="from-amber-500 to-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-1">Top Assets</h3>
          <p className="text-sm text-white/40 mb-6">Play count distribution</p>
          
          <div className="h-[300px]">
            {topAssetsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAssetsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="plays" 
                    name="Plays"
                    fill="url(#barGradient)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(263, 70%, 60%)" />
                      <stop offset="100%" stopColor="hsl(330, 81%, 60%)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/30">
                No data to display
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-1">Device Distribution</h3>
          <p className="text-sm text-white/40 mb-6">Plays per device</p>
          
          <div className="h-[300px]">
            {deviceDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deviceDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/30">
                No data to display
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {deviceDistributionData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-xs text-white/60">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
        {/* Table Tabs */}
        <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-white/[0.02]">
          {(['assets', 'devices', 'playlists'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="data-table">
            {activeTab === "assets" && (
              <>
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Play Count</th>
                    <th>Total Duration</th>
                    <th>Avg Duration</th>
                    <th>First Played</th>
                    <th>Last Played</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_asset.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-white/40 py-8">
                        No asset data available
                      </td>
                    </tr>
                  ) : (
                    data.by_asset.map((asset) => (
                      <tr key={asset.asset_id}>
                        <td className="font-medium text-white">{asset.asset_id}</td>
                        <td className="text-white/70">{asset.play_count}</td>
                        <td className="text-white/70">{formatDuration(asset.total_duration)}</td>
                        <td className="text-white/70">{formatDuration(Math.round(asset.avg_duration))}</td>
                        <td className="text-white/50">{formatDate(asset.first_played)}</td>
                        <td className="text-white/50">{formatDate(asset.last_played)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {activeTab === "devices" && (
              <>
                <thead>
                  <tr>
                    <th>Device ID</th>
                    <th>Play Count</th>
                    <th>Total Duration</th>
                    <th>Unique Assets</th>
                    <th>Avg Duration</th>
                    <th>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_device.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-white/40 py-8">
                        No device data available
                      </td>
                    </tr>
                  ) : (
                    data.by_device.map((device) => (
                      <tr key={device.device_id}>
                        <td className="font-medium text-white">{device.device_id}</td>
                        <td className="text-white/70">{device.play_count}</td>
                        <td className="text-white/70">{formatDuration(device.total_duration)}</td>
                        <td className="text-white/70">{device.unique_assets}</td>
                        <td className="text-white/70">{formatDuration(Math.round(device.avg_duration))}</td>
                        <td className="text-white/50">{formatDate(device.last_played)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {activeTab === "playlists" && (
              <>
                <thead>
                  <tr>
                    <th>Playlist ID</th>
                    <th>Play Count</th>
                    <th>Total Duration</th>
                    <th>Unique Assets</th>
                    <th>Unique Devices</th>
                    <th>Last Played</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_playlist.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-white/40 py-8">
                        No playlist data available
                      </td>
                    </tr>
                  ) : (
                    data.by_playlist.map((playlist) => (
                      <tr key={playlist.playlist_id}>
                        <td className="font-medium text-white">{playlist.playlist_id}</td>
                        <td className="text-white/70">{playlist.play_count}</td>
                        <td className="text-white/70">{formatDuration(playlist.total_duration)}</td>
                        <td className="text-white/70">{playlist.unique_assets}</td>
                        <td className="text-white/70">{playlist.unique_devices}</td>
                        <td className="text-white/50">{formatDate(playlist.last_played)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
