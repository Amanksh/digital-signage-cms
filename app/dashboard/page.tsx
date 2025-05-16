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

export default function DashboardPage() {
  const [numAssets, setNumAssets] = useState(0);
  const [numPlaylists, setNumPlaylists] = useState(0);
  const [numDisplays, setNumDisplays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assets
        const assetsRes = await fetch("/api/assets");
        const assets = await assetsRes.json();
        setNumAssets(assets.length);

        // Fetch playlists
        const playlistsRes = await fetch("/api/playlists");
        const playlists = await playlistsRes.json();
        setNumPlaylists(playlists.length);

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
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: "New asset uploaded",
                  description: "You uploaded 'Summer Promotion.mp4'",
                  time: "2 hours ago",
                },
                {
                  title: "Playlist updated",
                  description: "You updated 'Main Lobby Display' playlist",
                  time: "Yesterday",
                },
                {
                  title: "Display connected",
                  description: "New display 'Reception Area' connected",
                  time: "2 days ago",
                },
                {
                  title: "Asset deleted",
                  description: "You deleted 'Old Promotion.jpg'",
                  time: "3 days ago",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 rounded-lg border p-3"
                >
                  <div className="flex-1 space-y-1">
                    <p className="font-medium leading-none">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Popular Assets</CardTitle>
            <CardDescription>
              Your most viewed assets this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: "Summer Promotion.mp4",
                  type: "Video",
                  views: 423,
                },
                {
                  name: "New Product Launch.jpg",
                  type: "Image",
                  views: 352,
                },
                {
                  name: "Company News.html",
                  type: "HTML",
                  views: 289,
                },
                {
                  name: "Weekly Schedule.jpg",
                  type: "Image",
                  views: 198,
                },
              ].map((asset, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <FileImage className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium leading-none">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {asset.type}
                    </p>
                  </div>
                  <div className="text-sm font-medium">{asset.views} views</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
