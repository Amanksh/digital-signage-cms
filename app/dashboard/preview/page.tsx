"use client"

import { useEffect, useState, useRef } from "react"
import { ArrowLeft, Expand, Pause, Play, SkipBack, SkipForward, X } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"

type PlaylistItem = {
  id: string
  name: string
  type: "image" | "video" | "html"
  duration: number
  thumbnail: string
  content?: string
}

export default function PreviewPage() {
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load playlist from sessionStorage
  useEffect(() => {
    try {
      const storedPlaylist = sessionStorage.getItem("previewPlaylist")
      if (storedPlaylist) {
        const parsedPlaylist = JSON.parse(storedPlaylist)
        setPlaylist(parsedPlaylist)
      } else {
        // Fallback to sample playlist if nothing in sessionStorage
        setPlaylist([
          {
            id: "1",
            name: "Summer Promotion",
            type: "image",
            duration: 10,
            thumbnail: "/placeholder.svg?height=600&width=800",
            content: "/placeholder.svg?height=600&width=800",
          },
          {
            id: "2",
            name: "Product Launch",
            type: "image",
            duration: 8,
            thumbnail: "/placeholder.svg?height=600&width=800",
            content: "/placeholder.svg?height=600&width=800",
          },
          {
            id: "3",
            name: "Company News",
            type: "html",
            duration: 15,
            thumbnail: "/placeholder.svg?height=600&width=800",
            content:
              "<div style='height: 100%; display: flex; align-items: center; justify-content: center; background-color: #f0f0f0;'><h1>Company News</h1></div>",
          },
          {
            id: "4",
            name: "Weekly Schedule",
            type: "image",
            duration: 12,
            thumbnail: "/placeholder.svg?height=600&width=800",
            content: "/placeholder.svg?height=600&width=800",
          },
        ])
      }
    } catch (error) {
      console.error("Error loading playlist:", error)
      toast({
        title: "Error loading playlist",
        description: "There was an error loading your playlist. Please try again.",
        variant: "destructive",
      })
    }
  }, [])

  // Handle playlist playback
  useEffect(() => {
    if (playlist.length === 0) return

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (isPlaying) {
      const currentItem = playlist[currentIndex]

      // Handle video playback differently
      if (currentItem.type === "video" && videoRef.current) {
        videoRef.current.play().catch((error) => {
          console.error("Error playing video:", error)
          // If autoplay is blocked, we'll need user interaction
          setIsPlaying(false)
        })

        // For videos, we'll use the video's natural duration and timeupdate event
        const updateVideoProgress = () => {
          if (videoRef.current) {
            const currentTime = videoRef.current.currentTime
            const duration = videoRef.current.duration || currentItem.duration
            setProgress((currentTime / duration) * 100)

            // Move to next item when video ends
            if (currentTime >= duration) {
              nextItem()
            }
          }
        }

        videoRef.current.addEventListener("timeupdate", updateVideoProgress)
        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener("timeupdate", updateVideoProgress)
          }
        }
      } else {
        // For images and HTML, use the configured duration
        const interval = 50 // Update progress every 50ms
        const steps = (currentItem.duration * 1000) / interval
        let currentStep = 0

        timerRef.current = setInterval(() => {
          currentStep++
          setProgress((currentStep / steps) * 100)

          if (currentStep >= steps) {
            // Move to next item
            nextItem()
          }
        }, interval)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying, currentIndex, playlist])

  const togglePlay = () => {
    const currentItem = playlist[currentIndex]

    if (currentItem?.type === "video" && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch((error) => {
          console.error("Error playing video:", error)
        })
      }
    }

    setIsPlaying(!isPlaying)
  }

  const nextItem = () => {
    // Stop any video that might be playing
    if (videoRef.current) {
      videoRef.current.pause()
    }

    setCurrentIndex((currentIndex + 1) % playlist.length)
    setProgress(0)
  }

  const prevItem = () => {
    // Stop any video that might be playing
    if (videoRef.current) {
      videoRef.current.pause()
    }

    setCurrentIndex((currentIndex - 1 + playlist.length) % playlist.length)
    setProgress(0)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const currentItem = playlist[currentIndex] || {
    id: "",
    name: "No content",
    type: "image",
    duration: 0,
    thumbnail: "/placeholder.svg",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <a href="/dashboard/playlists">
              <ArrowLeft className="h-4 w-4" />
            </a>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">Preview Playlist</h2>
        </div>
        <Button onClick={toggleFullscreen}>
          <Expand className="mr-2 h-4 w-4" />
          Full Screen
        </Button>
      </div>

      <div ref={containerRef} className="relative">
        {isFullscreen && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-4 z-50 bg-background/80 backdrop-blur-sm"
            onClick={exitFullscreen}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <Card className={`overflow-hidden ${isFullscreen ? "fixed inset-0 z-40 rounded-none" : ""}`}>
          <div
            className={`${isFullscreen ? "h-[calc(100vh-120px)]" : "aspect-video"} bg-black flex items-center justify-center`}
          >
            {currentItem.type === "image" && (
              <img
                src={currentItem.content || currentItem.thumbnail || "/placeholder.svg"}
                alt={currentItem.name}
                className="h-full w-full object-contain"
              />
            )}
            {currentItem.type === "video" && (
              <video
                ref={videoRef}
                src={currentItem.content}
                className="h-full w-full object-contain"
                controls={false}
                muted={false}
                loop={false}
                playsInline
              />
            )}
            {currentItem.type === "html" && (
              <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: currentItem.content || "" }} />
            )}
          </div>
          <CardContent
            className={`p-4 ${isFullscreen ? "fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm" : ""}`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{currentItem.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Item {currentIndex + 1} of {playlist.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevItem}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextItem}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!isFullscreen && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {playlist.map((item, index) => (
            <Card
              key={item.id}
              className={`cursor-pointer overflow-hidden ${index === currentIndex ? "ring-2 ring-primary" : ""}`}
              onClick={() => {
                setCurrentIndex(index)
                setProgress(0)
              }}
            >
              <div className="aspect-video bg-muted">
                {item.type === "image" ? (
                  <img
                    src={item.thumbnail || "/placeholder.svg"}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : item.type === "video" ? (
                  <div className="relative h-full w-full">
                    <img
                      src={item.thumbnail || "/placeholder.svg"}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white opacity-70" />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted">
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                )}
              </div>
              <CardContent className="p-2">
                <p className="truncate text-xs font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.duration}s</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
