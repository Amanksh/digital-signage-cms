"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

type Asset = {
  _id: string;
  name: string;
  type: string;
  url: string;
};

type PlaylistItem = {
  assetId: Asset;
  duration: number;
  order: number;
};

type Playlist = {
  _id: string;
  name: string;
  items: PlaylistItem[];
};

const PlaylistPreviewPage = ({
  params,
}: {
  params: { playlistId: string };
}) => {
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPlaylist();
    document.body.style.overflow = "hidden";

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.back();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "auto";
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [router]);

  useEffect(() => {
    if (playlist?.items.length) {
      startPlayback();
    }
  }, [playlist, currentIndex]);

  const fetchPlaylist = async () => {
    try {
      const response = await fetch(`/api/playlists/${params.playlistId}`);
      if (!response.ok) throw new Error("Failed to fetch playlist");
      const data = await response.json();
      setPlaylist(data);
    } catch (error) {
      console.error("Error fetching playlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startPlayback = () => {
    if (!playlist?.items.length) return;

    const currentItem = playlist.items[currentIndex];
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % playlist.items.length);
    }, currentItem.duration * 1000);
  };

  const handleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          <p>Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist?.items.length) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <p>No content to display</p>
          <Button
            variant="outline"
            className="mt-4 text-white"
            onClick={() => router.back()}
          >
            <X className="mr-2 h-4 w-4" />
            Exit Preview
          </Button>
        </div>
      </div>
    );
  }

  const currentItem = playlist.items[currentIndex];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center bg-black"
      onClick={handleFullscreen}
    >
      <div className="absolute right-4 top-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70"
          onClick={() => router.back()}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {currentItem.assetId.type === "IMAGE" && (
        <img
          src={currentItem.assetId.url}
          alt={currentItem.assetId.name}
          className="h-full w-full object-contain"
        />
      )}

      {currentItem.assetId.type === "VIDEO" && (
        <video
          src={currentItem.assetId.url}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-contain"
        />
      )}

      {currentItem.assetId.type === "HTML" && (
        <iframe
          src={currentItem.assetId.url}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}

      {currentItem.assetId.type === "URL" && (
        <iframe
          src={currentItem.assetId.url}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
};

export default PlaylistPreviewPage;
