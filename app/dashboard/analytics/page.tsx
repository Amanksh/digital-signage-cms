"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Monitor, FileImage, PlayCircle, Code, Zap, Activity, Link } from "lucide-react";

interface DisplayStats {
  total: number;
  active: number;
  disconnected: number;
  lastUpdated: string;
}

interface Asset {
  _id: string;
  name: string;
  type: "IMAGE" | "VIDEO" | "HTML" | "URL";
  url: string;
  createdAt: string;
  size: number;
  thumbnail?: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DisplayStats | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, assetsResponse] = await Promise.all([
          fetch("/api/analytics/displays", {
            credentials: "include",
          }),
          fetch("/api/assets", {
            credentials: "include",
          }),
        ]);

        // Check if responses are ok
        if (!statsResponse.ok) {
          const errorText = await statsResponse.text();
          let errorMessage = "Failed to fetch display statistics";
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          
          // Redirect to login if unauthorized
          if (statsResponse.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(errorMessage);
        }

        if (!assetsResponse.ok) {
          const errorText = await assetsResponse.text();
          let errorMessage = "Failed to fetch assets";
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          
          // Redirect to login if unauthorized
          if (assetsResponse.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(errorMessage);
        }

        // Parse JSON responses
        const [statsData, assetsData] = await Promise.all([
          statsResponse.json(),
          assetsResponse.json(),
        ]);

        setStats(statsData);
        setAssets(assetsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load statistics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  const displayChartData = [
    {
      name: "Connected",
      value: stats?.active || 0,
      color: "#10b981",
    },
    {
      name: "Disconnected",
      value: (stats?.total || 0) - (stats?.active || 0),
      color: "#ef4444",
    },
  ];

  const getAssetCounts = () => {
    const counts = {
      total: assets.length,
      images: assets.filter((asset) => asset.type === "IMAGE").length,
      videos: assets.filter((asset) => asset.type === "VIDEO").length,
      html: assets.filter((asset) => asset.type === "HTML").length,
      url: assets.filter((asset) => asset.type === "URL").length,
    };

    return [
      { name: "Total", value: counts.total },
      { name: "Images", value: counts.images },
      { name: "Videos", value: counts.videos },
      { name: "HTML", value: counts.html },
      { name: "URL", value: counts.url },
    ];
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Monitor your digital signage performance</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>Last updated: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : "Never"}</span>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Connected Displays</p>
                <p className="text-3xl font-bold text-green-700">{stats?.active || 0}</p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                <Monitor className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Disconnected Displays</p>
                <p className="text-3xl font-bold text-red-700">{(stats?.total || 0) - (stats?.active || 0)}</p>
              </div>
              <div className="h-12 w-12 bg-red-500 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Assets</p>
                <p className="text-3xl font-bold text-blue-700">{assets.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                <FileImage className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Active Playlists</p>
                <p className="text-3xl font-bold text-purple-700">{Math.floor(assets.length / 2)}</p>
              </div>
              <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center">
                <PlayCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="space-y-8">
        {/* Display Status Chart - Single Impressive Bar Chart */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold">Device Analytics</span>
                  <p className="text-sm text-blue-100">Connection status overview</p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number"
                    allowDecimals={false} 
                    domain={[0, "auto"]}
                    tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      fontSize: '14px',
                      padding: '12px'
                    }}
                    formatter={(value) => [value, 'Displays']}
                  />
                  <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={80}>
                    {displayChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-green-700">Connected</span>
                </div>
                <div className="text-2xl font-bold text-green-700">{stats?.active || 0}</div>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-red-700">Disconnected</span>
                </div>
                <div className="text-2xl font-bold text-red-700">{(stats?.total || 0) - (stats?.active || 0)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Asset Distribution Section */}
      <div className="space-y-6">
        {/* Asset Overview Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          {getAssetCounts().map((item, index) => {
            const colors = [
              { bg: "from-blue-50 to-blue-100", border: "border-blue-200", text: "text-blue-600", icon: FileImage },
              { bg: "from-green-50 to-green-100", border: "border-green-200", text: "text-green-600", icon: FileImage },
              { bg: "from-purple-50 to-purple-100", border: "border-purple-200", text: "text-purple-600", icon: PlayCircle },
              { bg: "from-orange-50 to-orange-100", border: "border-orange-200", text: "text-orange-600", icon: Code },
              { bg: "from-pink-50 to-pink-100", border: "border-pink-200", text: "text-pink-600", icon: Link },
            ];
            const colorScheme = colors[index] || colors[0];
            const IconComponent = colorScheme.icon;
            
            return (
              <Card key={index} className={`bg-gradient-to-br ${colorScheme.bg} ${colorScheme.border} border-2 hover:shadow-lg transition-shadow duration-200`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${colorScheme.text}`}>{item.name}</p>
                      <p className={`text-2xl font-bold ${colorScheme.text.replace('600', '700')}`}>{item.value}</p>
                    </div>
                    <div className={`h-10 w-10 bg-gradient-to-br ${colorScheme.bg.replace('50', '500').replace('100', '600')} rounded-full flex items-center justify-center`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Asset Distribution Chart - Single Impressive Bar Chart */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600">
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <FileImage className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold">Asset Analytics</span>
                  <p className="text-sm text-purple-100">Comprehensive distribution by type</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{assets.length}</div>
                <div className="text-sm text-purple-100">Total Assets</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getAssetCounts()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number"
                    allowDecimals={false} 
                    domain={[0, "auto"]}
                    tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      fontSize: '14px',
                      padding: '12px'
                    }}
                    formatter={(value) => [value, 'Assets']}
                  />
                  <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={60}>
                    {getAssetCounts().map((entry, index) => {
                      const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Asset Insights - Compact */}
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <FileImage className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700">Images</span>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {getAssetCounts().find(item => item.name === 'Images')?.value || 0}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <PlayCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Videos</span>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {getAssetCounts().find(item => item.name === 'Videos')?.value || 0}
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Code className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-700">Active Types</span>
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {getAssetCounts().filter(item => item.value > 0).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
