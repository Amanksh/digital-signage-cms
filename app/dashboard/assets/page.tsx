"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FileImage,
  FileVideo,
  Globe,
  MoreHorizontal,
  Plus,
  Search,
  Trash,
  FolderOpen,
  X,
  Upload,
  ArrowLeft,
  File,
  Folder,
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { generateVideoThumbnail } from "@/lib/video";

type CampaignAsset = {
  assetId: string;
  _id: string;
  name: string;
  type: "IMAGE" | "VIDEO" | "HTML" | "URL";
  url: string;
  thumbnail?: string;
  duration: number;
  size: number;
  createdAt: string;
};

type Campaign = {
  _id: string;
  id: string;
  name: string;
  description?: string;
  type: "campaign";
  assets: CampaignAsset[];
  assetCount: number;
  createdAt: string;
  updatedAt: string;
};

type DirectAsset = {
  _id: string;
  id: string;
  name: string;
  type: "IMAGE" | "VIDEO" | "HTML" | "URL";
  url: string;
  thumbnail?: string;
  duration: number;
  size: number;
  createdAt: string;
  itemType: "asset";
};

export default function AssetsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [directAssets, setDirectAssets] = useState<DirectAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Campaign Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDescription, setNewCampaignDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Campaign Detail Panel (when inside a folder)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTab, setUploadTab] = useState<"file" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rootFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/assets?view=combined");
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setCampaigns(data.campaigns || []);
      setDirectAssets(data.assets || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load assets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/campaign/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newCampaignName,
          description: newCampaignDescription,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create campaign");
      }

      toast.success("Campaign created successfully");
      setNewCampaignName("");
      setNewCampaignDescription("");
      setIsCreateModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create campaign"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign? All assets inside will also be deleted.")) {
      return;
    }

    try {
      const response = await fetch(`/api/campaign/${campaignId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete campaign");
      }

      toast.success("Campaign deleted successfully");
      if (selectedCampaign?._id === campaignId) {
        setSelectedCampaign(null);
        setIsPanelOpen(false);
      }
      fetchData();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete campaign"
      );
    }
  };

  const handleDeleteAsset = async (assetId: string, isDirectAsset: boolean = false) => {
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete asset");

      toast.success("Asset deleted successfully");
      
      if (isDirectAsset) {
        // Refresh all data
        fetchData();
      } else if (selectedCampaign) {
        // Refresh the campaign data
        const updatedCampaign = await fetch(`/api/campaign/${selectedCampaign._id}`);
        if (updatedCampaign.ok) {
          const data = await updatedCampaign.json();
          setSelectedCampaign(data);
        }
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset");
    }
  };

  const openCampaignPanel = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsPanelOpen(true);
    setUploadTab("file");
  };

  // Instant file upload (no name/description required)
  const handleInstantUpload = async (file: File, campaignId: string | null = null) => {
    setIsUploading(true);
    
    try {
      const type = file.type.startsWith("image/")
        ? "IMAGE"
        : file.type.startsWith("video/")
        ? "VIDEO"
        : "URL";

      // Generate thumbnail for videos
      let thumbnail: string | null = null;
      if (type === "VIDEO") {
        try {
          thumbnail = await generateVideoThumbnail(file);
        } catch (error) {
          console.error("Failed to generate thumbnail:", error);
        }
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      if (campaignId) {
        formData.append("campaignId", campaignId);
      }
      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }

      const response = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const { asset, signedUrl } = await response.json();

      // Upload to S3
      await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      toast.success("Asset uploaded successfully");

      // Refresh data
      if (campaignId && selectedCampaign) {
        const updatedCampaign = await fetch(`/api/campaign/${campaignId}`);
        if (updatedCampaign.ok) {
          const data = await updatedCampaign.json();
          setSelectedCampaign(data);
        }
      }
      fetchData();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    campaignId: string | null = null
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Upload files one by one
    for (const file of Array.from(files)) {
      await handleInstantUpload(file, campaignId);
    }

    // Reset input
    e.target.value = "";
  };

  // Handle URL upload
  const handleUrlUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    if (selectedCampaign.assetCount >= 9) {
      toast.error("Maximum 9 assets allowed in one Campaign.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append("campaignId", selectedCampaign._id);

    setIsUploading(true);
    try {
      const response = await fetch("/api/assets/url", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add URL");
      }

      toast.success("URL asset added successfully");
      (e.target as HTMLFormElement).reset();

      // Refresh campaign data
      const updatedCampaign = await fetch(`/api/campaign/${selectedCampaign._id}`);
      if (updatedCampaign.ok) {
        const data = await updatedCampaign.json();
        setSelectedCampaign(data);
      }
      fetchData();
    } catch (error) {
      console.error("URL add error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add URL");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle URL upload for root (direct assets)
  const handleRootUrlUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);

    setIsUploading(true);
    try {
      const response = await fetch("/api/assets/url", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add URL");
      }

      toast.success("URL asset added successfully");
      (e.target as HTMLFormElement).reset();
      fetchData();
    } catch (error) {
      console.error("URL add error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add URL");
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, campaignId: string | null = null) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        await handleInstantUpload(file, campaignId);
      } else {
        toast.error(`Unsupported file type: ${file.name}`);
      }
    }
  }, []);

  // Filter content based on search
  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDirectAssets = directAssets.filter((asset) =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getThumbnailUrl = (asset: CampaignAsset | DirectAsset) => {
    switch (asset.type) {
      case "IMAGE":
        return asset.url;
      case "VIDEO":
        return asset.thumbnail || "/video.webp";
      case "URL":
      case "HTML":
        return "/url.jpg";
      default:
        return asset.url;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "IMAGE": return <FileImage className="h-4 w-4" />;
      case "VIDEO": return <FileVideo className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const hasNoContent = filteredCampaigns.length === 0 && filteredDirectAssets.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Assets</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => rootFileInputRef.current?.click()} disabled={isUploading}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Asset
          </Button>
          <input
            ref={rootFileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*"
            multiple
            onChange={(e) => handleFileChange(e, null)}
          />
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search campaigns and assets..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Drop Zone & Content Grid */}
      <div
        className={`relative min-h-[300px] rounded-lg transition-colors ${
          isDragging ? "bg-primary/10 border-2 border-dashed border-primary" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Drop files here to upload</p>
              <p className="text-sm text-muted-foreground">Files will be uploaded as direct assets</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="text-muted-foreground">Loading assets...</p>
            </div>
          </div>
        ) : hasNoContent ? (
          <Card className="flex flex-col items-center justify-center p-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload files directly or create campaigns to organize your assets.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => rootFileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Asset
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* Campaign Folders First */}
            {filteredCampaigns.map((campaign) => (
              <CampaignFolderCard
                key={campaign._id}
                campaign={campaign}
                onClick={() => openCampaignPanel(campaign)}
                onDelete={() => handleDeleteCampaign(campaign._id)}
                getThumbnailUrl={getThumbnailUrl}
              />
            ))}

            {/* Then Direct Assets */}
            {filteredDirectAssets.map((asset) => (
              <DirectAssetCard
                key={asset._id}
                asset={asset}
                onDelete={() => handleDeleteAsset(asset._id, true)}
                getThumbnailUrl={getThumbnailUrl}
                formatFileSize={formatFileSize}
                getAssetIcon={getAssetIcon}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a Campaign</DialogTitle>
            <DialogDescription>
              Create a new campaign folder to organize your assets.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                placeholder="Enter campaign name"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleCreateCampaign()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-description">Description (Optional)</Label>
              <Textarea
                id="campaign-description"
                placeholder="Enter campaign description"
                value={newCampaignDescription}
                onChange={(e) => setNewCampaignDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Detail Side Panel */}
      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedCampaign && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  {selectedCampaign.name}
                </SheetTitle>
                <SheetDescription>
                  {selectedCampaign.assetCount}/9 assets
                  {selectedCampaign.description && (
                    <span className="block mt-1">{selectedCampaign.description}</span>
                  )}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Upload Section */}
                <div className="space-y-4">
                  <h4 className="font-medium">Add Assets</h4>
                  <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as "file" | "url")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="file">Upload File</TabsTrigger>
                      <TabsTrigger value="url">From URL</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="file" className="mt-4">
                      <div
                        className={`flex h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input bg-muted/40 hover:bg-muted/60 transition-colors ${
                          selectedCampaign.assetCount >= 9 ? "opacity-50 cursor-not-allowed" : ""
                        } ${isUploading ? "opacity-50" : ""}`}
                        onClick={() => selectedCampaign.assetCount < 9 && !isUploading && fileInputRef.current?.click()}
                      >
                        {isUploading ? (
                          <>
                            <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          </>
                        ) : (
                          <>
                            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click or drag files to upload</p>
                            <p className="text-xs text-muted-foreground mt-1">Images and videos</p>
                          </>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*,video/*"
                          multiple
                          onChange={(e) => handleFileChange(e, selectedCampaign._id)}
                          disabled={selectedCampaign.assetCount >= 9 || isUploading}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="url" className="mt-4">
                      <form onSubmit={handleUrlUpload} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="url">URL</Label>
                          <Input
                            id="url"
                            name="url"
                            type="url"
                            placeholder="https://example.com"
                            required
                            disabled={selectedCampaign.assetCount >= 9}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Content Type</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "image", label: "Image", icon: FileImage },
                              { id: "video", label: "Video", icon: FileVideo },
                              { id: "webpage", label: "Webpage", icon: Globe },
                            ].map(({ id, label, icon: Icon }) => (
                              <label
                                key={id}
                                className="flex flex-col items-center gap-1 rounded-md border p-2 cursor-pointer hover:bg-accent [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
                              >
                                <input
                                  type="radio"
                                  name="contentType"
                                  value={id}
                                  defaultChecked={id === "image"}
                                  className="sr-only"
                                  disabled={selectedCampaign.assetCount >= 9}
                                />
                                <Icon className="h-4 w-4" />
                                <span className="text-xs">{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isUploading || selectedCampaign.assetCount >= 9}
                        >
                          {isUploading ? "Adding..." : "Add URL"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                  
                  {selectedCampaign.assetCount >= 9 && (
                    <p className="text-sm text-destructive text-center">
                      Maximum 9 assets reached for this campaign.
                    </p>
                  )}
                </div>

                {/* Assets List */}
                <div className="space-y-4">
                  <h4 className="font-medium">Assets ({selectedCampaign.assetCount})</h4>
                  {selectedCampaign.assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 border rounded-md border-dashed">
                      <FolderOpen className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No assets yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedCampaign.assets.map((asset) => (
                        <AssetCard
                          key={asset._id}
                          asset={asset}
                          onDelete={() => handleDeleteAsset(asset._id)}
                          getThumbnailUrl={getThumbnailUrl}
                          formatFileSize={formatFileSize}
                          getAssetIcon={getAssetIcon}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CampaignFolderCard({
  campaign,
  onClick,
  onDelete,
  getThumbnailUrl,
}: {
  campaign: Campaign;
  onClick: () => void;
  onDelete: () => void;
  getThumbnailUrl: (asset: CampaignAsset) => string;
}) {
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group" onClick={onClick}>
      <div className="relative aspect-video bg-muted">
        {campaign.assets && campaign.assets.length > 0 ? (
          <div className="grid grid-cols-2 h-full">
            {campaign.assets.slice(0, 4).map((asset, index) => (
              <div key={asset._id} className="relative overflow-hidden border-[0.5px] border-border">
                <img src={getThumbnailUrl(asset)} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
            {campaign.assets.length < 4 &&
              Array.from({ length: 4 - campaign.assets.length }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-muted/50 flex items-center justify-center border-[0.5px] border-border">
                  <FolderOpen className="h-6 w-6 text-muted-foreground/30" />
                </div>
              ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
          {campaign.assetCount}/9
        </div>
        <div className="absolute top-2 left-2">
          <Folder className="h-5 w-5 text-amber-500 fill-amber-500 drop-shadow" />
        </div>
      </div>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <span className="font-medium truncate">{campaign.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background" align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {campaign.assetCount} asset{campaign.assetCount !== 1 ? "s" : ""}
        </p>
      </CardContent>
    </Card>
  );
}

function DirectAssetCard({
  asset,
  onDelete,
  getThumbnailUrl,
  formatFileSize,
  getAssetIcon,
}: {
  asset: DirectAsset;
  onDelete: () => void;
  getThumbnailUrl: (asset: DirectAsset) => string;
  formatFileSize: (bytes: number) => string;
  getAssetIcon: (type: string) => React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-video">
        <img src={getThumbnailUrl(asset)} alt={asset.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-full items-center justify-center">
            <Link href={asset.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="secondary">Preview</Button>
            </Link>
          </div>
        </div>
        <div className="absolute top-2 left-2">
          <div className="bg-background/80 backdrop-blur-sm rounded-full p-1.5">
            {getAssetIcon(asset.type)}
          </div>
        </div>
      </div>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 truncate min-w-0">
            <span className="text-sm font-medium truncate">{asset.name}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background" align="end">
              <DropdownMenuItem asChild>
                <Link href={asset.url} target="_blank" rel="noopener noreferrer">
                  <File className="mr-2 h-4 w-4" />
                  Preview
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={onDelete}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground">{formatFileSize(asset.size)}</p>
      </CardContent>
    </Card>
  );
}

function AssetCard({
  asset,
  onDelete,
  getThumbnailUrl,
  formatFileSize,
  getAssetIcon,
}: {
  asset: CampaignAsset;
  onDelete: () => void;
  getThumbnailUrl: (asset: CampaignAsset) => string;
  formatFileSize: (bytes: number) => string;
  getAssetIcon: (type: string) => React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-video">
        <img src={getThumbnailUrl(asset)} alt={asset.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-full items-center justify-center">
            <Link href={asset.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="secondary">Preview</Button>
            </Link>
          </div>
        </div>
      </div>
      <CardContent className="p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 truncate min-w-0">
            {getAssetIcon(asset.type)}
            <span className="text-xs font-medium truncate">{asset.name}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onDelete}>
            <Trash className="h-3 w-3 text-destructive" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{formatFileSize(asset.size)}</p>
      </CardContent>
    </Card>
  );
}
