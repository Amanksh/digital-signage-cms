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
  FormDescription,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
} from "@hello-pangea/dnd";
import { Clock, GripVertical, MoreVertical, Trash } from "lucide-react";

const playlistFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
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

interface PlaylistItem {
  _id: string;
  assetId: {
    _id: string;
    name: string;
    type: string;
    duration: number;
    url: string;
  } | null;
  duration: number;
  order: number;
}

export default function EditPlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
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
    const fetchPlaylist = async () => {
      try {
        const response = await fetch(`/api/playlists/${id}`);
        if (!response.ok) throw new Error("Failed to fetch playlist");
        const data = await response.json();

        const validItems = data.items.filter(
          (item: PlaylistItem) => item.assetId !== null
        );

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

        setPlaylistItems(validItems);
      } catch (error) {
        console.error("Error fetching playlist:", error);
        toast.error("Failed to load playlist");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAssets = async () => {
      try {
        const response = await fetch("/api/assets");
        if (!response.ok) throw new Error("Failed to fetch assets");
        const data = await response.json();
        setAvailableAssets(data.filter((asset: any) => asset !== null));
      } catch (error) {
        console.error("Error fetching assets:", error);
        toast.error("Failed to load assets");
      }
    };

    fetchPlaylist();
    fetchAssets();
  }, [id, form]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(playlistItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setPlaylistItems(updatedItems);
  };

  const handleAddItem = (assetId: string) => {
    const asset = availableAssets.find((a) => a?._id === assetId);
    if (!asset) return;

    const newItem: PlaylistItem = {
      _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assetId: {
        _id: asset._id,
        name: asset.name,
        type: asset.type,
        url: asset.url,
        duration: asset.duration,
      },
      duration: asset.duration,
      order: playlistItems.length,
    };

    setPlaylistItems([...playlistItems, newItem]);
  };

  // const handleRemoveItem = (item: PlaylistItem) => {
  //   console.log(item);
  //   setItemToRemove(item);
  //   setShowRemoveDialog(true);
  // };

  const handleRemoveItem = (item: PlaylistItem) => {
    console.log(item.assetId?._id);
    setPlaylistItems(
      playlistItems.filter((item1) => item1.assetId?._id !== item.assetId?._id)
    );
    console.log("Playlist Item:", playlistItems);
    toast.success("Item removed from playlist");
  };

  const handleClearPlaylist = () => {
    setPlaylistItems([]);
    toast.success("Playlist cleared");
  };

  const handleDurationChange = (itemId: string, duration: number) => {
    setPlaylistItems(
      playlistItems.map((item) =>
        item._id === itemId ? { ...item, duration } : item
      )
    );
  };

  async function onSubmit(data: PlaylistFormValues) {
    setIsLoading(true);
    try {
      // Update order numbers before submission
      const updatedItems = playlistItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      // Prepare the items data
      const preparedItems = updatedItems.map((item) => {
        if (!item.assetId?._id) {
          throw new Error("Invalid asset ID found in playlist items");
        }
        return {
          assetId: item.assetId._id,
          duration: Number(item.duration),
          order: item.order,
        };
      });

      const response = await fetch(`/api/playlists/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          items: preparedItems,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to update playlist");
      }

      toast.success("Playlist updated successfully");
      router.push("/dashboard/playlists");
    } catch (error) {
      console.error("Error updating playlist:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update playlist"
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading playlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Playlist</h2>
        <p className="text-muted-foreground">
          Update your playlist details and content
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Playlist Information</CardTitle>
              <CardDescription>
                Update your playlist details and schedule
              </CardDescription>
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
                      <Textarea
                        placeholder="Enter playlist description"
                        {...field}
                      />
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                  <CardTitle>Playlist Items</CardTitle>
                  <CardDescription>
                    Manage the content and order of your playlist
                  </CardDescription>
                </div>
                {playlistItems.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={handleClearPlaylist}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Clear Playlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Select onValueChange={handleAddItem}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add content" />
                  </SelectTrigger>
                  <SelectContent className="bg-background-panel">
                    {availableAssets.map((asset) => (
                      <SelectItem key={asset._id} value={asset._id}>
                        {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {playlistItems.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    No items in playlist. Add some content to get started.
                  </p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="playlist-items">
                    {(provided: DroppableProvided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {playlistItems.map((item, index) => (
                          <Draggable
                            key={item._id}
                            draggableId={item._id}
                            index={index}
                          >
                            {(provided: DraggableProvided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-center gap-4 rounded-lg border p-4"
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab"
                                >
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {item.assetId?.name || "Unknown Asset"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.assetId?.type || "Unknown Type"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.duration}
                                      onChange={(e) =>
                                        handleDurationChange(
                                          item._id,
                                          parseInt(e.target.value)
                                        )
                                      }
                                      className="w-20"
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveItem(item)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/playlists")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
