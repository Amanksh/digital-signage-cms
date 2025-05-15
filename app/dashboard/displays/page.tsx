"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Monitor, Plus, Power, Search, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Display = {
  id: string
  name: string
  location: string
  status: "online" | "offline" | "maintenance"
  lastActive: string
  playlist: string
  resolution: string
}

export default function DisplaysPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const displays: Display[] = [
    {
      id: "1",
      name: "Main Lobby Display",
      location: "Main Lobby",
      status: "online",
      lastActive: "Active now",
      playlist: "Main Lobby Content",
      resolution: "1920x1080",
    },
    {
      id: "2",
      name: "Cafeteria Screen",
      location: "Cafeteria",
      status: "online",
      lastActive: "Active now",
      playlist: "Cafeteria Announcements",
      resolution: "1920x1080",
    },
    {
      id: "3",
      name: "Reception Area",
      location: "Reception",
      status: "offline",
      lastActive: "Last seen 2 days ago",
      playlist: "Welcome Content",
      resolution: "1920x1080",
    },
    {
      id: "4",
      name: "Meeting Room A",
      location: "Meeting Room A",
      status: "maintenance",
      lastActive: "Under maintenance",
      playlist: "None",
      resolution: "1920x1080",
    },
    {
      id: "5",
      name: "Product Showcase",
      location: "Showroom",
      status: "online",
      lastActive: "Active now",
      playlist: "Product Showcase",
      resolution: "3840x2160",
    },
    {
      id: "6",
      name: "Hallway Display",
      location: "Main Hallway",
      status: "offline",
      lastActive: "Last seen 5 hours ago",
      playlist: "Company Events",
      resolution: "1920x1080",
    },
  ]

  const filteredDisplays = displays.filter(
    (display) =>
      display.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      display.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "offline":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Displays</h2>
        <Link href="/dashboard/displays/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Display
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search displays..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="online">Online</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDisplays.map((display) => (
              <DisplayCard key={display.id} display={display} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="online" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDisplays
              .filter((display) => display.status === "online")
              .map((display) => (
                <DisplayCard key={display.id} display={display} />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="offline" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDisplays
              .filter((display) => display.status === "offline")
              .map((display) => (
                <DisplayCard key={display.id} display={display} />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="maintenance" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDisplays
              .filter((display) => display.status === "maintenance")
              .map((display) => (
                <DisplayCard key={display.id} display={display} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DisplayCard({ display }: { display: Display }) {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "offline":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{display.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Change playlist</DropdownMenuItem>
              <DropdownMenuItem>Remote control</DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Power className="mr-2 h-4 w-4" />
                Reboot
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{display.location}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(display.status)}`}>
            {display.status.charAt(0).toUpperCase() + display.status.slice(1)}
          </span>
          <span className="text-xs text-muted-foreground">{display.lastActive}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Current Playlist</p>
            <p className="font-medium truncate">{display.playlist}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Resolution</p>
            <p className="font-medium">{display.resolution}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex w-full gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Preview
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Control
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
