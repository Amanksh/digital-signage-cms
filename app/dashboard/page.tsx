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

interface Display {
  _id: string;
  name: string;
  deviceId: string;
  location?: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: string;
  playlistId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export default function DashboardPage() {
  const [numAssets, setNumAssets] = useState(0);
  const [numPlaylists, setNumPlaylists] = useState(0);
  const [numDisplays, setNumDisplays] = useState(0);
  const [recentPlaylists, setRecentPlaylists] = useState<Playlist[]>([]);
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [displays, setDisplays] = useState<Display[]>([]);
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
        setDisplays(displays);
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
        <Card className="transition duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary">
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
        <Card className="transition duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary">
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
        <Card className="transition duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary">
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
        <Card className="col-span-4 transition duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary">
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
        <Card className="col-span-3 transition duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary">
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
      
      <div className="grid gap-4">
        <Card className="transition duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Displays</CardTitle>
                <CardDescription>All your connected displays and their status</CardDescription>
              </div>
              <Link href="/dashboard/displays/new">
                <Button size="sm" className="h-8 gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Display</span>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground">
                  Loading displays...
                </div>
              ) : displays.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No displays found. Add your first display to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {displays.map((display) => {
                    const isOnline = display.status === 'online';
                    const lastSeen = new Date(display.lastSeen);
                    const timeAgo = Math.floor((new Date().getTime() - lastSeen.getTime()) / (1000 * 60)); // minutes ago
                    
                    return (
                      <div key={display._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Monitor className={`h-5 w-5 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
                          </div>
                          <div>
                            <p className="font-medium">{display.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {display.deviceId} • {display.location || 'No location'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {isOnline ? 'Active now' : `Last seen ${timeAgo}m ago`}
                            </span>
                          </div>
                          {display.playlistId ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              Playing: {display.playlistId.name}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1">No playlist assigned</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
