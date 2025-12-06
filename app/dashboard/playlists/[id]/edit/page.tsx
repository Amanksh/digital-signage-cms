"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
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

const playlistFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "scheduled"]),
  schedule: z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      daysOfWeek: z.array(z.number()).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
    })
    .optional(),
});

type PlaylistFormValues = z.infer<typeof playlistFormSchema>;

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

export default function EditPlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [directAssets, setDirectAssets] = useState<DirectAsset[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<DirectAsset[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addTab, setAddTab] = useState<"campaigns" | "assets">("campaigns");
  const { id } = use(params);

  const form = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "inactive",
      schedule: {
        startDate: "",
        endDate: "",
        daysOfWeek: [],
        startTime: "",
        endTime: "",
      },
    },
  });

  useEffect(() => {
    fetchData();
    fetchPlaylist();
  }, [id]);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/assets?view=combined");
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setCampaigns(data.campaigns || []);
      setDirectAssets(data.assets || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchPlaylist = async () => {
    try {
      const response = await fetch(`/api/playlists/${id}`);
      if (!response.ok) throw new Error("Failed to fetch playlist");
      const data = await response.json();

      form.reset({
        name: data.name || "",
        description: data.description || "",
        status: data.status || "inactive",
        schedule: data.schedule || {
          startDate: "",
          endDate: "",
          daysOfWeek: [],
          startTime: "",
          endTime: "",
        },
      });

      // Set selected campaigns from the playlist
      if (data.campaignIds && data.campaignIds.length > 0) {
        const mappedCampaigns = data.campaignIds.map((c: any) => ({
          _id: c._id,
          name: c.name,
          type: "campaign",
          assets: c.assets || c.previewAssets || [],
          assetCount: c.assetCount || c.assets?.length || 0,
        }));
        setSelectedCampaigns(mappedCampaigns);
      }

      // Set selected direct assets from the playlist
      if (data.assetIds && data.assetIds.length > 0) {
        const mappedAssets = data.assetIds.map((a: any) => ({
          _id: a._id,
          name: a.name,
          type: a.type,
          url: a.url,
          thumbnail: a.thumbnail,
          size: a.size || 0,
        }));
        setSelectedAssets(mappedAssets);
      }
    } catch (error) {
      console.error("Error fetching playlist:", error);
      toast.error("Failed to load playlist");
    } finally {
      setIsLoading(false);
    }
  };

  const addCampaign = (campaign: Campaign) => {
    if (selectedCampaigns.length >= 7) {
      toast.error("Maximum 7 campaigns allowed per playlist.");
      return;
    }

    if (selectedCampaigns.find((c) => c._id === campaign._id)) {
      toast.error("This campaign is already in the playlist.");
      return;
    }

    setSelectedCampaigns([...selectedCampaigns, campaign]);
    setAddDialogOpen(false);
  };

  const addAsset = (asset: DirectAsset) => {
    if (selectedAssets.find((a) => a._id === asset._id)) {
      toast.error("This asset is already in the playlist.");
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
    (sum, c) => sum + (c.assetCount || 0),
    0
  ) + selectedAssets.length;

  async function onSubmit(data: PlaylistFormValues) {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/playlists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          campaignIds: selectedCampaigns.map((c) => c._id),
          assetIds: selectedAssets.map((a) => a._id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update playlist");
      }

      toast.success("Playlist updated successfully");
      router.push("/dashboard/playlists");
    } catch (error) {
      console.error("Error updating playlist:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update playlist");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading playlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Playlist</h2>
        <p className="text-muted-foreground">Update your playlist details and content</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Playlist Information</CardTitle>
              <CardDescription>Update your playlist details and schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter playlist name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter playlist description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("status") === "scheduled" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="schedule.startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="schedule.endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="schedule.startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="schedule.endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Content</CardTitle>
                  <CardDescription>
                    {selectedCampaigns.length} campaign{selectedCampaigns.length !== 1 ? "s" : ""} • {selectedAssets.length} direct asset{selectedAssets.length !== 1 ? "s" : ""} • {totalAssets} total items
                  </CardDescription>
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
                      <DialogDescription>Select campaigns or direct assets to add to your playlist.</DialogDescription>
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
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/playlists")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
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
          {campaign.assetCount || 0} assets
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
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp} disabled={index === 0}>
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
        <p className="text-sm text-muted-foreground">{campaign.assetCount || 0} assets</p>
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
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp} disabled={index === 0}>
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
