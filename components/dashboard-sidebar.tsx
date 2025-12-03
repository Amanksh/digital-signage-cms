"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BarChart3,
  FileImage,
  Home,
  LogOut,
  Monitor,
  PlayCircle,
  Settings,
  User,
  Activity,
  Sparkles,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { useState } from "react";

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);

  const routes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      name: "Assets",
      href: "/dashboard/assets",
      icon: FileImage,
      gradient: "from-pink-500 to-rose-500",
    },
    {
      name: "Playlists",
      href: "/dashboard/playlists",
      icon: PlayCircle,
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      name: "Displays",
      href: "/dashboard/displays",
      icon: Monitor,
      gradient: "from-emerald-500 to-green-500",
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      name: "Playback",
      href: "/dashboard/playback",
      icon: Activity,
      gradient: "from-fuchsia-500 to-pink-500",
    },
  ];

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar className="border-r border-white/5 bg-[hsl(222,47%,7%)]">
          <SidebarHeader className="p-6 border-b border-white/5">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-black/80 p-2.5 rounded-xl border border-white/10">
                  <Image 
                    src="/orion-logo.png" 
                    width={32} 
                    height={32} 
                    alt="Orion LED" 
                    className="h-8 w-8"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text-amber">
                  Orion LED
                </h1>
                <p className="text-[10px] text-white/40 font-medium tracking-wider uppercase">
                  Digital Signage CMS
                </p>
              </div>
            </Link>
          </SidebarHeader>
          
          <SidebarContent className="px-3 py-6">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-full mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-all duration-200"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Search...</span>
              <kbd className="ml-auto text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/40">
                ⌘K
              </kbd>
            </button>
            
            <p className="px-4 mb-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">
              Navigation
            </p>
            
            <SidebarMenu className="space-y-1">
              {routes.map((route, index) => {
                const isActive = pathname === route.href;
                return (
                  <SidebarMenuItem key={route.href} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                    <SidebarMenuButton asChild tooltip={route.name}>
                      <Link
                        href={route.href}
                        className={`
                          relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                          ${isActive 
                            ? 'bg-white/10 text-white' 
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                          }
                        `}
                      >
                        {/* Active Indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-violet-500 to-pink-500" />
                        )}
                        
                        {/* Icon with gradient background when active */}
                        <div className={`
                          flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300
                          ${isActive 
                            ? `bg-gradient-to-br ${route.gradient} shadow-lg` 
                            : 'bg-white/5 group-hover:bg-white/10'
                          }
                        `}>
                          <route.icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-white/70'}`} />
                        </div>
                        
                        <span className={`font-medium ${isActive ? 'text-white' : ''}`}>
                          {route.name}
                        </span>
                        
                        {isActive && (
                          <ChevronRight className="ml-auto h-4 w-4 text-white/50" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            
            {/* Pro Feature Banner */}
            <div className="mt-8 mx-1 p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-white/80">Pro Features</span>
              </div>
              <p className="text-[11px] text-white/50 mb-3">
                Unlock advanced analytics and scheduling
              </p>
              <button className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity">
                Upgrade Now
              </button>
            </div>
          </SidebarContent>
          
          <SidebarFooter className="p-3 border-t border-white/5">
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all duration-200"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5">
                      <Settings className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-medium">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Profile">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all duration-200"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-medium">Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Logout">
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5">
                      <LogOut className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-medium">Logout</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Header */}
          <header className="sticky top-0 z-50 h-16 border-b border-white/5 bg-[hsl(222,47%,6%)]/80 backdrop-blur-xl">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white/60 hover:text-white" />
                <div className="hidden md:block">
                  <h1 className="text-lg font-semibold text-white">
                    {routes.find((route) => route.href === pathname)?.name || "Dashboard"}
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <button className="relative p-2.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
                </button>
                
                {/* User Menu */}
                <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-white">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-xs text-white/50">
                      {session?.user?.email || "user@example.com"}
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl blur opacity-50" />
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                      {session?.user?.name?.charAt(0) || "U"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto bg-[hsl(222,47%,6%)] p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
