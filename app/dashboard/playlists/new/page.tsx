"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  FileImage,
  FileVideo,
  Globe,
  GripVertical,
  Plus,
  X,
} from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

type PlaylistItem = {
  id: string;
  name: string;
  type: "image" | "video" | "html";
  duration: number;
  thumbnail: string;
};

export default function NewPlaylistPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<PlaylistItem[]>([]);
  const [previewAssetIndex, setPreviewAssetIndex] = useState(0);

  // Sample assets
  const availableAssets: PlaylistItem[] = [
    {
      id: "1",
      name: "Summer Promotion",
      type: "image",
      duration: 10,
      thumbnail: "/image1.png",
    },
  ];

  const addAssetToPlaylist = (asset: PlaylistItem) => {
    setSelectedAssets([...selectedAssets, asset]);
  };

  const removeAssetFromPlaylist = (assetId: string) => {
    setSelectedAssets(selectedAssets.filter((asset) => asset.id !== assetId));
  };

  const updateAssetDuration = (assetId: string, duration: number) => {
    setSelectedAssets(
      selectedAssets.map((asset) =>
        asset.id === assetId ? { ...asset, duration } : asset
      )
    );
  };

  const getTotalDuration = () => {
    const totalSeconds = selectedAssets.reduce(
      (total, asset) => total + asset.duration,
      0
    );
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="h-4 w-4" />;
      case "video":
        return <FileVideo className="h-4 w-4" />;
      case "html":
        return <Globe className="h-4 w-4" />;
      default:
        return <FileImage className="h-4 w-4" />;
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAssets.length === 0) {
      toast({
        title: "No assets selected",
        description: "Please add at least one asset to your playlist.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    // Simulate saving
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Playlist saved",
        description: "Your playlist has been saved successfully.",
      });
      router.push("/dashboard/playlists");
    }, 1500);
  };

  const openFullScreenPreview = () => {
    if (selectedAssets.length === 0) return;

    // Store the current playlist in sessionStorage for the preview page
    sessionStorage.setItem("previewPlaylist", JSON.stringify(selectedAssets));

    // Open the preview in a new tab or navigate to the preview page
    window.open("/dashboard/preview", "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          Create New Playlist
        </h2>
        <div className="flex gap-2">
          <Link href="/dashboard/playlists">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={isSaving || selectedAssets.length === 0}
          >
            {isSaving ? "Saving..." : "Save Playlist"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Playlist Details</CardTitle>
              <CardDescription>
                Enter the basic information for your playlist
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Playlist Name</Label>
                <Input id="name" placeholder="Enter playlist name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter a description for this playlist"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue="active">
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transition">Transition Effect</Label>
                  <Select defaultValue="fade">
                    <SelectTrigger id="transition">
                      <SelectValue placeholder="Select transition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="loop" defaultChecked />
                <Label htmlFor="loop">Loop playlist</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Playlist Content</CardTitle>
              <CardDescription>
                Add and arrange content for your playlist
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedAssets.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed border-input bg-muted/40 px-4 py-5 text-center">
                  <p className="text-sm font-medium">No assets added yet</p>
                  <p className="text-xs text-muted-foreground">
                    Select assets from the right panel to add them to your
                    playlist
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedAssets.map((asset, index) => (
                    <div
                      key={`${asset.id}-${index}`}
                      className={`flex items-center gap-3 rounded-md border p-2 ${
                        index === previewAssetIndex ? "bg-muted" : "bg-card"
                      }`}
                      onClick={() => setPreviewAssetIndex(index)}
                    >
                      <div className="flex h-full items-center text-muted-foreground">
                        <GripVertical className="h-5 w-5 cursor-move" />
                      </div>
                      <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-sm">
                        <img
                          src={asset.thumbnail || "/placeholder.svg"}
                          alt={asset.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getAssetIcon(asset.type)}
                          <span className="truncate font-medium">
                            {asset.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{asset.duration}s</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Label
                            htmlFor={`duration-${asset.id}`}
                            className="text-xs whitespace-nowrap"
                          >
                            Display for:
                          </Label>
                          <Input
                            id={`duration-${asset.id}`}
                            type="number"
                            className="w-16 h-8"
                            value={asset.duration}
                            min="1"
                            onChange={(e) =>
                              updateAssetDuration(
                                asset.id,
                                Number.parseInt(e.target.value) || 1
                              )
                            }
                          />
                          <span className="text-xs whitespace-nowrap">
                            seconds
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeAssetFromPlaylist(asset.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-3">
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Total duration: {getTotalDuration()}</span>
              </div>
              <div className="text-sm">{selectedAssets.length} items</div>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Assets</CardTitle>
              <CardDescription>
                Select assets to add to your playlist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Input placeholder="Search assets..." />
              </div>

              <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="videos">Videos</TabsTrigger>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <div className="space-y-2">
                    {availableAssets.map((asset) => (
                      <AssetItem
                        key={asset.id}
                        asset={asset}
                        onAdd={() => addAssetToPlaylist(asset)}
                        isAdded={selectedAssets.some((a) => a.id === asset.id)}
                      />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="images" className="mt-4">
                  <div className="space-y-2">
                    {availableAssets
                      .filter((asset) => asset.type === "image")
                      .map((asset) => (
                        <AssetItem
                          key={asset.id}
                          asset={asset}
                          onAdd={() => addAssetToPlaylist(asset)}
                          isAdded={selectedAssets.some(
                            (a) => a.id === asset.id
                          )}
                        />
                      ))}
                  </div>
                </TabsContent>
                <TabsContent value="videos" className="mt-4">
                  <div className="space-y-2">
                    {availableAssets
                      .filter((asset) => asset.type === "video")
                      .map((asset) => (
                        <AssetItem
                          key={asset.id}
                          asset={asset}
                          onAdd={() => addAssetToPlaylist(asset)}
                          isAdded={selectedAssets.some(
                            (a) => a.id === asset.id
                          )}
                        />
                      ))}
                  </div>
                </TabsContent>
                <TabsContent value="html" className="mt-4">
                  <div className="space-y-2">
                    {availableAssets
                      .filter((asset) => asset.type === "html")
                      .map((asset) => (
                        <AssetItem
                          key={asset.id}
                          asset={asset}
                          onAdd={() => addAssetToPlaylist(asset)}
                          isAdded={selectedAssets.some(
                            (a) => a.id === asset.id
                          )}
                        />
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/assets/new" className="w-full">
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Asset
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Preview your playlist</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-md bg-muted flex items-center justify-center overflow-hidden">
                {selectedAssets.length > 0 ? (
                  <img
                    src={
                      selectedAssets[previewAssetIndex]?.thumbnail ||
                      "/placeholder.svg"
                    }
                    alt="Preview"
                    className="h-full w-full object-cover rounded-md"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p className="text-sm">No content to preview</p>
                    <p className="text-xs">Add assets to see preview</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                disabled={selectedAssets.length === 0}
                onClick={openFullScreenPreview}
              >
                <FileImage className="mr-2 h-4 w-4" />
                Preview Full Screen
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AssetItem({
  asset,
  onAdd,
  isAdded,
}: {
  asset: PlaylistItem;
  onAdd: () => void;
  isAdded: boolean;
}) {
  const getAssetIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="h-4 w-4" />;
      case "video":
        return <FileVideo className="h-4 w-4" />;
      case "html":
        return <Globe className="h-4 w-4" />;
      default:
        return <FileImage className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-md border bg-card p-2">
      <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-sm">
        <img
          src={asset.thumbnail || "/placeholder.svg"}
          alt={asset.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {getAssetIcon(asset.type)}
          <span className="truncate font-medium">{asset.name}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {asset.type === "image"
            ? "Image"
            : asset.type === "video"
            ? "Video"
            : "HTML Content"}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onAdd}
        disabled={isAdded}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
