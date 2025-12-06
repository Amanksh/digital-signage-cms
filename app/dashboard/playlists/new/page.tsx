"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash,
  FolderOpen,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  FileImage,
  FileVideo,
  Globe,
  Folder,
  File,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CampaignAsset = {
  _id: string;
  url: string;
  thumbnail?: string;
  type: string;
};

type Campaign = {
  _id: string;
  name: string;
  type: "campaign";
  assets: CampaignAsset[];
  assetCount: number;
};

type DirectAsset = {
  _id: string;
  name: string;
  type: "IMAGE" | "VIDEO" | "HTML" | "URL";
  url: string;
  thumbnail?: string;
  size: number;
};

export default function NewPlaylistPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [directAssets, setDirectAssets] = useState<DirectAsset[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<DirectAsset[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addTab, setAddTab] = useState<"campaigns" | "assets">("campaigns");
  const [schedule, setSchedule] = useState({
    startDate: "",
    endDate: "",
    daysOfWeek: [] as number[],
    startTime: "",
    endTime: "",
  });

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
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
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

    if (selectedCampaigns.length === 0 && selectedAssets.length === 0) {
      toast({
        title: "No content selected",
        description: "Please add at least one campaign or asset to the playlist.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          campaignIds: selectedCampaigns.map((c) => c._id),
          assetIds: selectedAssets.map((a) => a._id),
          schedule: showSchedule ? schedule : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create playlist");
      }

      toast({
        title: "Success",
        description: "Playlist created successfully",
      });

      router.push("/dashboard/playlists");
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create playlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addCampaign = (campaign: Campaign) => {
    if (selectedCampaigns.length >= 7) {
      toast({
        title: "Maximum campaigns reached",
        description: "Maximum 7 campaigns allowed per playlist.",
        variant: "destructive",
      });
      return;
    }

    if (selectedCampaigns.find((c) => c._id === campaign._id)) {
      toast({
        title: "Campaign already added",
        description: "This campaign is already in the playlist.",
        variant: "destructive",
      });
      return;
    }

    setSelectedCampaigns([...selectedCampaigns, campaign]);
    setAddDialogOpen(false);
  };

  const addAsset = (asset: DirectAsset) => {
    if (selectedAssets.find((a) => a._id === asset._id)) {
      toast({
        title: "Asset already added",
        description: "This asset is already in the playlist.",
        variant: "destructive",
      });
      return;
    }

    setSelectedAssets([...selectedAssets, asset]);
    setAddDialogOpen(false);
  };

  const removeCampaign = (index: number) => {
    setSelectedCampaigns(selectedCampaigns.filter((_, i) => i !== index));
  };

  const removeAsset = (index: number) => {
    setSelectedAssets(selectedAssets.filter((_, i) => i !== index));
  };

  const moveCampaign = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= selectedCampaigns.length) return;
    const newCampaigns = [...selectedCampaigns];
    const [removed] = newCampaigns.splice(fromIndex, 1);
    newCampaigns.splice(toIndex, 0, removed);
    setSelectedCampaigns(newCampaigns);
  };

  const moveAsset = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= selectedAssets.length) return;
    const newAssets = [...selectedAssets];
    const [removed] = newAssets.splice(fromIndex, 1);
    newAssets.splice(toIndex, 0, removed);
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

  const getThumbnailUrl = (item: CampaignAsset | DirectAsset) => {
    switch (item.type) {
      case "IMAGE":
        return item.url;
      case "VIDEO":
        return item.thumbnail || "/video.webp";
      default:
        return "/url.jpg";
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "IMAGE": return <FileImage className="h-4 w-4" />;
      case "VIDEO": return <FileVideo className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const availableCampaigns = campaigns.filter(
    (c) => !selectedCampaigns.find((sc) => sc._id === c._id)
  );

  const availableAssets = directAssets.filter(
    (a) => !selectedAssets.find((sa) => sa._id === a._id)
  );

  const totalAssets = selectedCampaigns.reduce(
    (sum, c) => sum + c.assetCount,
    0
  ) + selectedAssets.length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create New Playlist</h2>
        <p className="text-muted-foreground">
          Create a new playlist by selecting campaigns and/or direct assets.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Playlist Details</CardTitle>
            <CardDescription>Enter the basic information for your playlist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Enter playlist name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" name="description" placeholder="Enter playlist description" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Schedule</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowSchedule(!showSchedule)}>
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
                        onChange={(e) => setSchedule({ ...schedule, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={schedule.endDate}
                        onChange={(e) => setSchedule({ ...schedule, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => setSchedule({ ...schedule, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Days of Week</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                        <Button
                          key={day}
                          type="button"
                          variant={schedule.daysOfWeek.includes(index) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleDay(index)}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Content</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCampaigns.length} campaign{selectedCampaigns.length !== 1 ? "s" : ""} • {selectedAssets.length} direct asset{selectedAssets.length !== 1 ? "s" : ""} • {totalAssets} total items
                  </p>
                </div>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Content
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Content to Playlist</DialogTitle>
                      <DialogDescription>
                        Select campaigns or direct assets to add to your playlist.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs value={addTab} onValueChange={(v) => setAddTab(v as "campaigns" | "assets")}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="campaigns">
                          <Folder className="mr-2 h-4 w-4" />
                          Campaigns ({availableCampaigns.length})
                        </TabsTrigger>
                        <TabsTrigger value="assets">
                          <File className="mr-2 h-4 w-4" />
                          Direct Assets ({availableAssets.length})
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="campaigns" className="mt-4">
                        {isLoadingData ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        ) : availableCampaigns.length === 0 ? (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>No campaigns available</AlertTitle>
                            <AlertDescription>
                              {campaigns.length === 0
                                ? "Create a campaign first in the Assets page."
                                : "All campaigns have been added to this playlist."}
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {availableCampaigns.map((campaign) => (
                              <CampaignSelectorCard
                                key={campaign._id}
                                campaign={campaign}
                                onSelect={() => addCampaign(campaign)}
                                getThumbnailUrl={getThumbnailUrl}
                              />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="assets" className="mt-4">
                        {isLoadingData ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        ) : availableAssets.length === 0 ? (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>No direct assets available</AlertTitle>
                            <AlertDescription>
                              {directAssets.length === 0
                                ? "Upload assets directly (not in campaigns) from the Assets page."
                                : "All direct assets have been added to this playlist."}
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {availableAssets.map((asset) => (
                              <AssetSelectorCard
                                key={asset._id}
                                asset={asset}
                                onSelect={() => addAsset(asset)}
                                getThumbnailUrl={getThumbnailUrl}
                                getAssetIcon={getAssetIcon}
                              />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>

              {selectedCampaigns.length === 0 && selectedAssets.length === 0 ? (
                <Alert>
                  <FolderOpen className="h-4 w-4" />
                  <AlertTitle>No content selected</AlertTitle>
                  <AlertDescription>
                    Add campaigns or direct assets to build your playlist.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {/* Selected Campaigns */}
                  {selectedCampaigns.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Campaigns</Label>
                      {selectedCampaigns.map((campaign, index) => (
                        <SelectedCampaignCard
                          key={campaign._id}
                          campaign={campaign}
                          index={index}
                          totalCampaigns={selectedCampaigns.length}
                          onRemove={() => removeCampaign(index)}
                          onMoveUp={() => moveCampaign(index, index - 1)}
                          onMoveDown={() => moveCampaign(index, index + 1)}
                          getThumbnailUrl={getThumbnailUrl}
                        />
                      ))}
                    </div>
                  )}

                  {/* Selected Direct Assets */}
                  {selectedAssets.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Direct Assets</Label>
                      {selectedAssets.map((asset, index) => (
                        <SelectedAssetCard
                          key={asset._id}
                          asset={asset}
                          index={index}
                          totalAssets={selectedAssets.length}
                          onRemove={() => removeAsset(index)}
                          onMoveUp={() => moveAsset(index, index - 1)}
                          onMoveDown={() => moveAsset(index, index + 1)}
                          getThumbnailUrl={getThumbnailUrl}
                          getAssetIcon={getAssetIcon}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || (selectedCampaigns.length === 0 && selectedAssets.length === 0)} className="w-full">
              {isLoading ? "Creating..." : "Create Playlist"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

function CampaignSelectorCard({
  campaign,
  onSelect,
  getThumbnailUrl,
}: {
  campaign: Campaign;
  onSelect: () => void;
  getThumbnailUrl: (asset: CampaignAsset) => string;
}) {
  return (
    <Card className="cursor-pointer hover:border-primary transition-colors overflow-hidden" onClick={onSelect}>
      <div className="relative aspect-video bg-muted">
        {campaign.assets && campaign.assets.length > 0 ? (
          <div className="grid grid-cols-2 h-full">
            {campaign.assets.slice(0, 4).map((asset) => (
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
          {campaign.assetCount} assets
        </div>
        <div className="absolute top-2 left-2">
          <Folder className="h-5 w-5 text-amber-500 fill-amber-500" />
        </div>
      </div>
      <CardContent className="p-3">
        <h4 className="font-medium truncate">{campaign.name}</h4>
      </CardContent>
    </Card>
  );
}

function AssetSelectorCard({
  asset,
  onSelect,
  getThumbnailUrl,
  getAssetIcon,
}: {
  asset: DirectAsset;
  onSelect: () => void;
  getThumbnailUrl: (asset: DirectAsset) => string;
  getAssetIcon: (type: string) => React.ReactNode;
}) {
  return (
    <Card className="cursor-pointer hover:border-primary transition-colors overflow-hidden" onClick={onSelect}>
      <div className="relative aspect-video bg-muted">
        <img src={getThumbnailUrl(asset)} alt={asset.name} className="h-full w-full object-cover" />
        <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5">
          {getAssetIcon(asset.type)}
        </div>
      </div>
      <CardContent className="p-3">
        <h4 className="font-medium truncate text-sm">{asset.name}</h4>
      </CardContent>
    </Card>
  );
}

function SelectedCampaignCard({
  campaign,
  index,
  totalCampaigns,
  onRemove,
  onMoveUp,
  onMoveDown,
  getThumbnailUrl,
}: {
  campaign: Campaign;
  index: number;
  totalCampaigns: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  getThumbnailUrl: (asset: CampaignAsset) => string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-md border p-4">
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveUp}
          disabled={index === 0}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveDown}
          disabled={index === totalCampaigns - 1}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-16 w-24 rounded overflow-hidden bg-muted flex-shrink-0">
        {campaign.assets && campaign.assets.length > 0 ? (
          <img src={getThumbnailUrl(campaign.assets[0])} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FolderOpen className="h-6 w-6 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-amber-500 fill-amber-500" />
          <p className="font-medium truncate">{campaign.name}</p>
        </div>
        <p className="text-sm text-muted-foreground">{campaign.assetCount} assets</p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SelectedAssetCard({
  asset,
  index,
  totalAssets,
  onRemove,
  onMoveUp,
  onMoveDown,
  getThumbnailUrl,
  getAssetIcon,
}: {
  asset: DirectAsset;
  index: number;
  totalAssets: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  getThumbnailUrl: (asset: DirectAsset) => string;
  getAssetIcon: (type: string) => React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-md border p-4">
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveUp}
          disabled={index === 0}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveDown}
          disabled={index === totalAssets - 1}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-16 w-24 rounded overflow-hidden bg-muted flex-shrink-0">
        <img src={getThumbnailUrl(asset)} alt={asset.name} className="h-full w-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {getAssetIcon(asset.type)}
          <p className="font-medium truncate">{asset.name}</p>
        </div>
        <p className="text-sm text-muted-foreground">{asset.type}</p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
}
