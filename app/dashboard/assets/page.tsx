"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileImage,
  FileVideo,
  Globe,
  MoreHorizontal,
  Plus,
  Search,
  Trash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type Asset = {
  _id: string;
  name: string;
  type: "IMAGE" | "VIDEO" | "HTML" | "URL";
  url: string;
  createdAt: string;
  size: number;
  thumbnail?: string;
};

export default function AssetsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/assets");
      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }
      const data = await response.json();
      console.log("data", data);
      setAssets(data);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Failed to load assets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete asset");
      }

      toast.success("Asset deleted successfully");
      fetchAssets(); // Refresh the assets list
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset");
    }
  };

  const filteredAssets = assets.filter((asset) =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "IMAGE":
        return <FileImage className="h-5 w-5" />;
      case "VIDEO":
        return <FileVideo className="h-5 w-5" />;
      case "HTML":
      case "URL":
        return <Globe className="h-5 w-5" />;
      default:
        return <FileImage className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Assets</h2>
        <Link href="/dashboard/assets/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search assets..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({filteredAssets.length})</TabsTrigger>
          <TabsTrigger value="images">
            Images (
            {filteredAssets.filter((asset) => asset.type === "IMAGE").length})
          </TabsTrigger>
          <TabsTrigger value="videos">
            Videos (
            {filteredAssets.filter((asset) => asset.type === "VIDEO").length})
          </TabsTrigger>
          <TabsTrigger value="html">
            HTML (
            {
              filteredAssets.filter(
                (asset) => asset.type === "HTML" || asset.type === "URL"
              ).length
            }
            )
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {isLoading ? (
              <div>Loading assets...</div>
            ) : filteredAssets.length === 0 ? (
              <div>No assets found</div>
            ) : (
              filteredAssets.map((asset) => (
                <AssetCard
                  key={asset._id}
                  asset={asset}
                  onDelete={() => handleDelete(asset._id)}
                />
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="images" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredAssets
              .filter((asset) => asset.type === "IMAGE")
              .map((asset) => (
                <AssetCard
                  key={asset._id}
                  asset={asset}
                  onDelete={() => handleDelete(asset._id)}
                />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="videos" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredAssets
              .filter((asset) => asset.type === "VIDEO")
              .map((asset) => (
                <AssetCard
                  key={asset._id}
                  asset={asset}
                  onDelete={() => handleDelete(asset._id)}
                />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="html" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredAssets
              .filter((asset) => asset.type === "HTML" || asset.type === "URL")
              .map((asset) => (
                <AssetCard
                  key={asset._id}
                  asset={asset}
                  onDelete={() => handleDelete(asset._id)}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssetCard({
  asset,
  onDelete,
}: {
  asset: Asset;
  onDelete: () => void;
}) {
  console.log(asset);
  const getAssetIcon = (type: string) => {
    switch (type) {
      case "IMAGE":
        return <FileImage className="h-5 w-5" />;
      case "VIDEO":
        return <FileVideo className="h-5 w-5" />;
      case "HTML":
      case "URL":
        return <Globe className="h-5 w-5" />;
      default:
        return <FileImage className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getThumbnailUrl = () => {
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
    <Card className="overflow-hidden">
      <div className="relative aspect-video">
        <img
          src={getThumbnailUrl()}
          alt={asset.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          <div className="flex h-full items-center justify-center gap-2">
            <Button size="sm" variant="secondary">
              Preview
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            {getAssetIcon(asset.type)}
            <span className="truncate font-medium">{asset.name}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background-panel" align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Preview</DropdownMenuItem>
              <DropdownMenuItem>Add to playlist</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Added on {new Date(asset.createdAt).toLocaleDateString()} •{" "}
          {formatFileSize(asset.size)}
        </div>
      </CardContent>
    </Card>
  );
}
