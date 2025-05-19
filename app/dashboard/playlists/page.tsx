"use client";

import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";

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
import { toast } from "@/components/ui/use-toast";

type Playlist = {
  _id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "scheduled";
  items: {
    assetId: {
      _id: string;
      name: string;
      type: string;
      url: string;
    };
    duration: number;
    order: number;
  }[];
  schedule?: {
    startDate: string;
    endDate: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  };
  createdAt: string;
  updatedAt: string;
};

export default function PlaylistsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/playlists");
      if (!response.ok) throw new Error("Failed to fetch playlists");
      const data = await response.json();
      setPlaylists(data);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      toast({
        title: "Error",
        description: "Failed to load playlists. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (playlistId: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;

    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete playlist");

      toast({
        title: "Success",
        description: "Playlist deleted successfully",
      });

      fetchPlaylists();
    } catch (error) {
      console.error("Error deleting playlist:", error);
      toast({
        title: "Error",
        description: "Failed to delete playlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredPlaylists = playlists.filter((playlist) => {
    const matchesSearch =
      playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playlist.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && playlist.status === activeTab;
  });

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

  const formatDuration = (items: Playlist["items"]) => {
    const totalSeconds = items.reduce((acc, item) => acc + item.duration, 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading playlists...</p>
        </div>
      </div>
    );
  }

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist._id}
                playlist={playlist}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlaylistCard({
  playlist,
  onDelete,
}: {
  playlist: Playlist;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
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

  const formatDuration = (items: Playlist["items"]) => {
    const totalSeconds = items.reduce((acc, item) => acc + item.duration, 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const thumbnail = playlist.items[0]?.assetId?.url || "/placeholder.svg";

  const handlePreview = () => {
    router.push(`/dashboard/playlists/preview/${playlist._id}`);
  };

  return (
    <Card>
      <div className="relative aspect-video">
        <img
          src={thumbnail}
          alt={playlist.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          <div className="flex h-full items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={handlePreview}>
              <Play className="mr-1 h-3 w-3" />
              Preview
            </Button>
            <Link href={`/dashboard/playlists/${playlist._id ?? ""}/edit`}>
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
            <DropdownMenuContent className="bg-background-panel" align="end">
              <DropdownMenuItem onClick={handlePreview}>
                <Play className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/playlists/${playlist._id ?? ""}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(playlist._id)}
              >
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
          {formatDuration(playlist.items)}
        </div>
        <div>{playlist.items.length} items</div>
      </CardFooter>
    </Card>
  );
}
