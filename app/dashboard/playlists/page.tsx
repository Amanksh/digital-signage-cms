"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Edit,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Trash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Playlist = {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  duration: string;
  status: "active" | "inactive" | "scheduled";
  thumbnail: string;
};

export default function PlaylistsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const playlists: Playlist[] = [
    {
      id: "1",
      name: "Main Lobby Display",
      description: "Content for the main lobby display",
      itemCount: 8,
      duration: "5:30",
      status: "active",
      thumbnail: "/placeholder.svg?height=200&width=300",
    },
  ];

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playlist.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Playlists</h2>
        <Link href="/dashboard/playlists/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Playlist
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search playlists..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlaylists
              .filter((playlist) => playlist.status === "active")
              .map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="scheduled" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlaylists
              .filter((playlist) => playlist.status === "scheduled")
              .map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="inactive" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlaylists
              .filter((playlist) => playlist.status === "inactive")
              .map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400";
    }
  };

  return (
    <Card>
      <div className="relative aspect-video">
        <img
          src={playlist.thumbnail || "/placeholder.svg"}
          alt={playlist.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          <div className="flex h-full items-center justify-center gap-2">
            <Button size="sm" variant="secondary">
              <Play className="mr-1 h-3 w-3" />
              Preview
            </Button>
            <Link href={`/dashboard/playlists/${playlist.id}/edit`}>
              <Button size="sm" variant="secondary">
                <Edit className="mr-1 h-3 w-3" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute right-2 top-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
              playlist.status
            )}`}
          >
            {playlist.status.charAt(0).toUpperCase() + playlist.status.slice(1)}
          </span>
        </div>
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{playlist.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Play className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Assign to display</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground">{playlist.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {playlist.duration}
        </div>
        <div>{playlist.itemCount} items</div>
      </CardFooter>
    </Card>
  );
}
