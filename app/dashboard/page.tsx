"use client";

import Link from "next/link";
import { BarChart3, FileImage, Monitor, PlayCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect } from "react";

interface Playlist {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface Asset {
  _id: string;
  name: string;
  type: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [numAssets, setNumAssets] = useState(0);
  const [numPlaylists, setNumPlaylists] = useState(0);
  const [numDisplays, setNumDisplays] = useState(0);
  const [recentPlaylists, setRecentPlaylists] = useState<Playlist[]>([]);
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assets
        const assetsRes = await fetch("/api/assets");
        const assets = await assetsRes.json();
        setNumAssets(assets.length);
        setRecentAssets(assets.slice(0, 4)); // Get 4 most recent assets

        // Fetch playlists
        const playlistsRes = await fetch("/api/playlists");
        const playlists = await playlistsRes.json();
        setNumPlaylists(playlists.length);
        setRecentPlaylists(playlists.slice(0, 4)); // Get 4 most recent playlists

        // Fetch displays
        const displaysRes = await fetch("/api/displays");
        const displays = await displaysRes.json();
        setNumDisplays(displays.length);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your digital signage
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/assets/new">
            <Button size="sm" className="h-8 gap-1">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Asset</span>
            </Button>
          </Link>
          <Link href="/dashboard/playlists/new">
            <Button size="sm" className="h-8 gap-1">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Playlist</span>
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : numAssets}
            </div>
            <p className="text-xs text-muted-foreground">Your media assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Playlists
            </CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : numPlaylists}
            </div>
            <p className="text-xs text-muted-foreground">Your playlists</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Connected Displays
            </CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : numDisplays}
            </div>
            <p className="text-xs text-muted-foreground">Your displays</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Playlists</CardTitle>
            <CardDescription>
              Your most recently created playlists
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground">
                  Loading...
                </div>
              ) : recentPlaylists.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No playlists found
                </div>
              ) : (
                recentPlaylists.map((playlist) => (
                  <div
                    key={playlist._id}
                    className="flex items-start gap-4 rounded-lg border p-3"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-none">
                        {playlist.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {playlist.description || "No description"}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(playlist.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Assets</CardTitle>
            <CardDescription>
              Your most recently uploaded assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground">
                  Loading...
                </div>
              ) : recentAssets.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No assets found
                </div>
              ) : (
                recentAssets.map((asset) => (
                  <div key={asset._id} className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <FileImage className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-none">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.type}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
