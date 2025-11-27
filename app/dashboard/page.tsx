"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  lastActive: string;
  playlistId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
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
        const assetsRes = await fetch("/api/assets", {
          credentials: "include",
        });
        
        if (!assetsRes.ok) {
          if (assetsRes.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch assets");
        }
        
        const assets = await assetsRes.json();
        // Ensure assets is an array
        if (Array.isArray(assets)) {
          setNumAssets(assets.length);
          setRecentAssets(assets.slice(0, 4)); // Get 4 most recent assets
        } else {
          setNumAssets(0);
          setRecentAssets([]);
        }

        // Fetch playlists
        const playlistsRes = await fetch("/api/playlists", {
          credentials: "include",
        });
        
        if (!playlistsRes.ok) {
          if (playlistsRes.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch playlists");
        }
        
        const playlists = await playlistsRes.json();
        // Ensure playlists is an array
        if (Array.isArray(playlists)) {
          setNumPlaylists(playlists.length);
          setRecentPlaylists(playlists.slice(0, 4)); // Get 4 most recent playlists
        } else {
          setNumPlaylists(0);
          setRecentPlaylists([]);
        }

        // Fetch displays
        const displaysRes = await fetch("/api/displays", {
          credentials: "include",
        });
        
        if (!displaysRes.ok) {
          if (displaysRes.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch displays");
        }
        
        const displays = await displaysRes.json();
        // Ensure displays is an array
        if (Array.isArray(displays)) {
          setNumDisplays(displays.length);
          setDisplays(displays);
        } else {
          setNumDisplays(0);
          setDisplays([]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
                <CardTitle>Last Sync</CardTitle>
                <CardDescription>
                  Most recently active devices
                </CardDescription>
              </div>
              <Link href="/dashboard/displays">
                <Button size="sm" className="h-8 gap-1">
                  <Monitor className="h-3.5 w-3.5" />
                  <span>View All</span>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading last sync...</div>
            ) : displays.length === 0 ? (
              <div className="text-center text-muted-foreground">No displays found.</div>
            ) : (
              <div className="space-y-3">
                {([...displays]
                  .filter((d) => !!d.lastActive)
                  .sort((a, b) => {
                    const aTime = new Date(a.lastActive).getTime();
                    const bTime = new Date(b.lastActive).getTime();
                    return bTime - aTime;
                  })
                  .slice(0, 5)).map((display) => {
                  const lastActiveDate = new Date(display.lastActive);
                  const isValid = !isNaN(lastActiveDate.getTime());
                  const diffMs = isValid ? Date.now() - lastActiveDate.getTime() : Number.POSITIVE_INFINITY;
                  const diffMins = Math.floor(diffMs / (1000 * 60));
                  const isOnline = isValid && diffMins <= 5;

                  let when = 'Never';
                  if (isValid) {
                    if (diffMins < 1) when = 'Just now';
                    else if (diffMins < 60) when = `${diffMins}m ago`;
                    else {
                      const hours = Math.floor(diffMins / 60);
                      const days = Math.floor(hours / 24);
                      if (days > 0) when = `${days}d ${hours % 24}h ago`;
                      else when = `${hours}h ${diffMins % 60}m ago`;
                    }
                  }

                  return (
                    <div key={display._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
                          <Monitor className={`h-5 w-5 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{display.name}</p>
                          <p className="text-sm text-muted-foreground">{display.deviceId} • {display.location || 'No location'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{isOnline ? 'Active now' : `Last seen ${when}`}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
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
                    // Safely handle missing or invalid lastActive
                    let isOnline = false;
                    let timeAgo = 'Never';
                    
                    if (display.lastActive) {
                      try {
                        const lastActive = new Date(display.lastActive);
                        if (!isNaN(lastActive.getTime())) {
                          const timeDiffMs = Date.now() - lastActive.getTime();
                          const timeDiffMins = Math.floor(timeDiffMs / (1000 * 60));
                          isOnline = timeDiffMins <= 5; // Online if last active within 5 minutes
                          
                          // Format time difference for display
                          if (!isOnline) {
                            const hours = Math.floor(timeDiffMins / 60);
                            const days = Math.floor(hours / 24);
                            const minutes = timeDiffMins % 60;
                            
                            if (days > 0) {
                              timeAgo = `${days}d ${hours % 24}h ago`;
                            } else if (hours > 0) {
                              timeAgo = `${hours}h ${minutes}m ago`;
                            } else {
                              timeAgo = `${minutes}m ago`;
                            }
                          } else {
                            timeAgo = 'Just now';
                          }
                        }
                      } catch (error) {
                        console.error('Error processing lastActive:', error);
                      }
                    }
                    
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
                              {isOnline ? 'Active now' : `Last seen ${timeAgo}`}
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
