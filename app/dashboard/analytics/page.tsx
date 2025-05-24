"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DisplayStats {
  total: number;
  active: number;
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
  const [stats, setStats] = useState<DisplayStats | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, assetsResponse] = await Promise.all([
          fetch("/api/analytics/displays"),
          fetch("/api/assets"),
        ]);

        if (!statsResponse.ok)
          throw new Error("Failed to fetch display statistics");
        if (!assetsResponse.ok) throw new Error("Failed to fetch assets");

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
      value: stats?.total || 0,
    },
    {
      name: "Active",
      value: stats?.active || 0,
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
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Display Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} domain={[0, "auto"]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Last updated:{" "}
              {stats?.lastUpdated
                ? new Date(stats.lastUpdated).toLocaleString()
                : "Never"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getAssetCounts()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} domain={[0, "auto"]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Total Assets: {assets.length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
