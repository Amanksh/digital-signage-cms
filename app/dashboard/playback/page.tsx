"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  RefreshCw
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

export default function PlaybackAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
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
      
      // Add non-empty filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim()) {
          params.append(key, value.trim());
        }
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
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportToCSV = () => {
    if (!data) return;
    
    let csvContent = "";
    let headers = [];
    let rows = [];
    
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
      headers = ["Device ID", "Play Count", "Total Duration (s)", "Unique Assets", "Avg Duration (s)", "First Played", "Last Played"];
      rows = data.by_device.map(device => [
        device.device_id,
        device.play_count,
        device.total_duration,
        device.unique_assets,
        device.avg_duration.toFixed(2),
        formatDate(device.first_played),
        formatDate(device.last_played)
      ]);
    } else {
      headers = ["Playlist ID", "Play Count", "Total Duration (s)", "Unique Assets", "Unique Devices", "Avg Duration (s)", "First Played", "Last Played"];
      rows = data.by_playlist.map(playlist => [
        playlist.playlist_id,
        playlist.play_count,
        playlist.total_duration,
        playlist.unique_assets,
        playlist.unique_devices,
        playlist.avg_duration.toFixed(2),
        formatDate(playlist.first_played),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Prepare chart data
  const topAssetsChartData = data.by_asset.slice(0, 10).map(asset => ({
    name: asset.asset_id.length > 20 ? asset.asset_id.substring(0, 20) + "..." : asset.asset_id,
    plays: asset.play_count,
    duration: asset.total_duration
  }));

  const deviceDistributionData = data.by_device.slice(0, 8).map((device, index) => ({
    name: device.device_id,
    value: device.play_count,
    fill: `hsl(${index * 45}, 70%, 60%)`
  }));

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Playback Analytics
          </h1>
          <p className="text-gray-600 mt-2">Proof-of-Play reporting and insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchReport} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="device_id">Device ID</Label>
              <Input
                id="device_id"
                value={filters.device_id}
                onChange={(e) => handleFilterChange("device_id", e.target.value)}
                placeholder="Filter by device..."
              />
            </div>
            <div>
              <Label htmlFor="asset_id">Asset ID</Label>
              <Input
                id="asset_id"
                value={filters.asset_id}
                onChange={(e) => handleFilterChange("asset_id", e.target.value)}
                placeholder="Filter by asset..."
              />
            </div>
            <div>
              <Label htmlFor="playlist_id">Playlist ID</Label>
              <Input
                id="playlist_id"
                value={filters.playlist_id}
                onChange={(e) => handleFilterChange("playlist_id", e.target.value)}
                placeholder="Filter by playlist..."
              />
            </div>
            <div>
              <Label htmlFor="date_from">From Date</Label>
              <Input
                id="date_from"
                type="datetime-local"
                value={filters.date_from}
                onChange={(e) => handleFilterChange("date_from", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date_to">To Date</Label>
              <Input
                id="date_to"
                type="datetime-local"
                value={filters.date_to}
                onChange={(e) => handleFilterChange("date_to", e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={applyFilters}>Apply Filters</Button>
            <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Plays</p>
                <p className="text-3xl font-bold text-blue-700">{data.summary.total_plays.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Play className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Duration</p>
                <p className="text-3xl font-bold text-green-700">{formatDuration(data.summary.total_duration)}</p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Active Devices</p>
                <p className="text-3xl font-bold text-purple-700">{data.summary.unique_devices}</p>
              </div>
              <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Monitor className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Unique Assets</p>
                <p className="text-3xl font-bold text-orange-700">{data.summary.unique_assets}</p>
              </div>
              <div className="h-12 w-12 bg-orange-500 rounded-full flex items-center justify-center">
                <FileImage className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-600">Active Playlists</p>
                <p className="text-3xl font-bold text-pink-700">{data.summary.unique_playlists}</p>
              </div>
              <div className="h-12 w-12 bg-pink-500 rounded-full flex items-center justify-center">
                <PlayCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Assets by Play Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAssetsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="plays" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detailed Reports</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={activeTab === "assets" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("assets")}
              >
                Assets
              </Button>
              <Button
                variant={activeTab === "devices" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("devices")}
              >
                Devices
              </Button>
              <Button
                variant={activeTab === "playlists" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("playlists")}
              >
                Playlists
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "assets" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset ID</TableHead>
                  <TableHead>Play Count</TableHead>
                  <TableHead>Total Duration</TableHead>
                  <TableHead>Avg Duration</TableHead>
                  <TableHead>First Played</TableHead>
                  <TableHead>Last Played</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_asset.map((asset) => (
                  <TableRow key={asset.asset_id}>
                    <TableCell className="font-medium">{asset.asset_id}</TableCell>
                    <TableCell>{asset.play_count}</TableCell>
                    <TableCell>{formatDuration(asset.total_duration)}</TableCell>
                    <TableCell>{formatDuration(Math.round(asset.avg_duration))}</TableCell>
                    <TableCell>{formatDate(asset.first_played)}</TableCell>
                    <TableCell>{formatDate(asset.last_played)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === "devices" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Play Count</TableHead>
                  <TableHead>Total Duration</TableHead>
                  <TableHead>Unique Assets</TableHead>
                  <TableHead>Avg Duration</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_device.map((device) => (
                  <TableRow key={device.device_id}>
                    <TableCell className="font-medium">{device.device_id}</TableCell>
                    <TableCell>{device.play_count}</TableCell>
                    <TableCell>{formatDuration(device.total_duration)}</TableCell>
                    <TableCell>{device.unique_assets}</TableCell>
                    <TableCell>{formatDuration(Math.round(device.avg_duration))}</TableCell>
                    <TableCell>{formatDate(device.last_played)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === "playlists" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Playlist ID</TableHead>
                  <TableHead>Play Count</TableHead>
                  <TableHead>Total Duration</TableHead>
                  <TableHead>Unique Assets</TableHead>
                  <TableHead>Unique Devices</TableHead>
                  <TableHead>Last Played</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_playlist.map((playlist) => (
                  <TableRow key={playlist.playlist_id}>
                    <TableCell className="font-medium">{playlist.playlist_id}</TableCell>
                    <TableCell>{playlist.play_count}</TableCell>
                    <TableCell>{formatDuration(playlist.total_duration)}</TableCell>
                    <TableCell>{playlist.unique_assets}</TableCell>
                    <TableCell>{playlist.unique_devices}</TableCell>
                    <TableCell>{formatDate(playlist.last_played)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
