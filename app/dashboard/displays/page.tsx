"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Monitor,
  Plus,
  Power,
  Search,
  Settings,
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
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

type Display = {
  _id: string;
  name: string;
  deviceId: string;
  location: string;
  status: "online" | "offline" | "maintenance";
  lastActive: string;
  playlistId?: {
    _id: string;
    name: string;
  };
  resolution: string;
};

export default function DisplaysPage() {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchDisplays();
  }, []);

  const fetchDisplays = async () => {
    try {
      const response = await fetch("/api/displays");
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch displays:", response.status, errorText);
        throw new Error(
          `Failed to fetch displays: ${response.status} ${errorText}`
        );
      }
      const data = await response.json();
      console.log("Fetched displays:", data);
      setDisplays(data);
    } catch (error) {
      console.error("Error fetching displays:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch displays",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDisplay = async (displayId: string) => {
    try {
      const response = await fetch(`/api/displays/${displayId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete display");

      setDisplays((prev) =>
        prev.filter((display) => display._id !== displayId)
      );
      toast({
        title: "Success",
        description: "Display deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting display:", error);
      toast({
        title: "Error",
        description: "Failed to delete display",
        variant: "destructive",
      });
    }
  };

  const handleAssignPlaylist = async (
    displayId: string,
    playlistId: string
  ) => {
    try {
      const response = await fetch(`/api/displays/${displayId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playlistId }),
      });

      if (!response.ok) throw new Error("Failed to assign playlist");

      setDisplays((prev) =>
        prev.map((display) =>
          display._id === displayId
            ? {
                ...display,
                playlistId: { _id: playlistId, name: "Loading..." },
              }
            : display
        )
      );

      toast({
        title: "Success",
        description: "Playlist assigned successfully",
      });
    } catch (error) {
      console.error("Error assigning playlist:", error);
      toast({
        title: "Error",
        description: "Failed to assign playlist",
        variant: "destructive",
      });
    }
  };

  const filteredDisplays = displays.filter(
    (display) =>
      display.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      display.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "offline":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Displays</h2>
        <Link href="/dashboard/displays/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Display
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search displays..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDisplays.map((display) => (
          <Card key={display._id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Monitor />
                  {display.name}
                </div>
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-background-panel"
                  align="end"
                >
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/dashboard/displays/${display._id}`)
                    }
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteDisplay(display._id)}
                    className="text-red-600"
                  >
                    <Power className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Device ID: {display.deviceId}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Location: {display.location}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Resolution: {display.resolution}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Playlist: {display.playlistId?.name || "None"}
                  </p>
                </div>
                <div
                  className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                    display.status
                  )}`}
                >
                  {display.status}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(
                    `/dashboard/displays/${display._id}/assign-playlist`
                  )
                }
              >
                <Monitor className="mr-2 h-4 w-4" />
                Assign Playlist
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
