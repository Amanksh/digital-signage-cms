"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Plus, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Asset = {
  _id: string;
  name: string;
  type: string;
  duration: number;
  url: string;
  thumbnail: string;
};

type PlaylistItem = {
  assetId: string;
  duration: number;
  order: number;
};

export default function NewPlaylistPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<PlaylistItem[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule] = useState({
    startDate: "",
    endDate: "",
    daysOfWeek: [] as number[],
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/assets");
      if (!response.ok) throw new Error("Failed to fetch assets");
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast({
        title: "Error",
        description: "Failed to load assets. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (selectedAssets.length === 0) {
      toast({
        title: "No assets selected",
        description: "Please add at least one asset to the playlist.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          items: selectedAssets,
          schedule: showSchedule ? schedule : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to create playlist");

      toast({
        title: "Success",
        description: "Playlist created successfully",
      });

      router.push("/dashboard/playlists");
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast({
        title: "Error",
        description: "Failed to create playlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addAsset = (asset: Asset) => {
    setSelectedAssets([
      ...selectedAssets,
      {
        assetId: asset._id,
        duration: asset.duration || 10, // Default duration in seconds
        order: selectedAssets.length,
      },
    ]);
  };

  const removeAsset = (index: number) => {
    setSelectedAssets(selectedAssets.filter((_, i) => i !== index));
  };

  const updateDuration = (index: number, duration: number) => {
    const newAssets = [...selectedAssets];
    newAssets[index].duration = duration;
    setSelectedAssets(newAssets);
  };

  const updateOrder = (index: number, newOrder: number) => {
    const newAssets = [...selectedAssets];
    const [removed] = newAssets.splice(index, 1);
    newAssets.splice(newOrder, 0, removed);
    newAssets.forEach((asset, i) => (asset.order = i));
    setSelectedAssets(newAssets);
  };

  const toggleDay = (day: number) => {
    setSchedule((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };
  const getThumbnailUrl = (asset: Asset) => {
    switch (asset.type) {
      case "IMAGE":
        return asset.url;
      case "VIDEO":
        return asset.thumbnail || "/video.webp";
      case "HTML":
        return "/html-placeholder.svg";
      case "URL":
        return "/url.jpg";
      default:
        return asset.url;
    }
  };
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Create New Playlist
        </h2>
        <p className="text-muted-foreground">
          Create a new playlist by selecting assets and setting their display
          duration
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Playlist Details</CardTitle>
            <CardDescription>
              Enter the basic information for your playlist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter playlist name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter playlist description"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Schedule</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSchedule(!showSchedule)}
                >
                  {showSchedule ? "Hide Schedule" : "Show Schedule"}
                </Button>
              </div>
              {showSchedule && (
                <div className="space-y-4 rounded-md border p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={schedule.startDate}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={schedule.endDate}
                        onChange={(e) =>
                          setSchedule({ ...schedule, endDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            startTime: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) =>
                          setSchedule({ ...schedule, endTime: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Days of Week</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day, index) => (
                          <Button
                            key={day}
                            type="button"
                            variant={
                              schedule.daysOfWeek.includes(index)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => toggleDay(index)}
                          >
                            {day}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Assets</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Asset
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Select Asset</DialogTitle>
                      <DialogDescription>
                        Choose an asset to add to your playlist
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      {assets.map((asset) => (
                        <Button
                          key={asset._id}
                          type="button"
                          variant="outline"
                          className="h-auto flex-col items-start p-4"
                          onClick={() => addAsset(asset)}
                        >
                          <img
                            src={getThumbnailUrl(asset)}
                            alt={asset.name}
                            className="mb-2 h-24 w-full object-cover"
                          />
                          <span className="text-sm font-medium">
                            {asset.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {asset.type}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                {selectedAssets.map((item, index) => {
                  const asset = assets.find((a) => a._id === item.assetId);
                  if (!asset) return null;

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 rounded-md border p-4"
                    >
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="h-16 w-24 object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.type}
                        </p>
                      </div>
                      <div className="relative flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="">
                            {asset.type === "VIDEO" && (
                              <p className="absolute -top-6 text-orange-500 text-sm">
                                1 Sec = Video duration
                              </p>
                            )}
                            <Input
                              type="number"
                              min="1"
                              value={item.duration}
                              onChange={(e) =>
                                updateDuration(index, parseInt(e.target.value))
                              }
                              className="w-20"
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            sec
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAsset(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Creating..." : "Create Playlist"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
