"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { use } from "react";

const formSchema = z.object({
  playlistId: z.string().min(1, "Please select a playlist"),
});

type Playlist = {
  _id: string;
  name: string;
};

type Display = {
  _id: string;
  name: string;
  playlistId?: {
    _id: string;
    name: string;
  };
};

export default function AssignPlaylistPage({
  params,
}: {
  params: Promise<{ displayId: string }>;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [display, setDisplay] = useState<Display | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const resolvedParams = use(params);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playlistId: "none",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch display details
        const displayResponse = await fetch(
          `/api/displays/${resolvedParams.displayId}`
        );
        if (!displayResponse.ok) throw new Error("Failed to fetch display");
        const displayData = await displayResponse.json();
        setDisplay(displayData);
        form.setValue("playlistId", displayData.playlistId?._id || "none");

        // Fetch playlists
        const playlistsResponse = await fetch("/api/playlists");
        if (!playlistsResponse.ok) throw new Error("Failed to fetch playlists");
        const playlistsData = await playlistsResponse.json();
        setPlaylists(playlistsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.displayId, form, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/displays/${resolvedParams.displayId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playlistId: values.playlistId === "none" ? null : values.playlistId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast({
        title: "Success",
        description: "Playlist assigned successfully",
      });

      router.push("/dashboard/displays");
    } catch (error) {
      console.error("Error assigning playlist:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to assign playlist",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Assign Playlist to {display?.name}
        </h2>
        <p className="text-muted-foreground">
          Select a playlist to assign to this display.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="playlistId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Playlist</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a playlist" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {playlists.map((playlist) => (
                      <SelectItem key={playlist._id} value={playlist._id}>
                        {playlist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Assigning..." : "Assign Playlist"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
