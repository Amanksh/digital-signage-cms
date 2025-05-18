"use client";

import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  BarChart3,
  FileImage,
  Home,
  LogOut,
  Monitor,
  PlayCircle,
  Settings,
  User,
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

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const routes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Assets",
      href: "/dashboard/assets",
      icon: FileImage,
    },
    {
      name: "Playlists",
      href: "/dashboard/playlists",
      icon: PlayCircle,
    },
    {
      name: "Displays",
      href: "/dashboard/displays",
      icon: Monitor,
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
    },
  ];

  return (
    <SidebarProvider defaultOpen>
      <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
        <Sidebar className="bg-background-panel border-r border-border">
          <SidebarHeader className="flex h-16 items-center border-b border-border px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 font-semibold text-text-primary"
            >
              <Monitor className="h-6 w-6" />
              <span className="text-lg">Orion LED</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="mt-3">
            <SidebarMenu>
              {routes.map((route) => (
                <SidebarMenuItem key={route.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === route.href}
                    tooltip={route.name}
                    className={`group transition-colors duration-200 ${
                      pathname === route.href
                        ? "text-primary bg-background-interface"
                        : "text-text-secondary hover:text-primary hover:bg-background-interface"
                    }`}
                  >
                    <Link
                      href={route.href}
                      className="flex items-center gap-3 px-6 py-3"
                    >
                      <route.icon
                        className={`h-5 w-5 transition-colors duration-200 ${
                          pathname === route.href
                            ? "text-primary"
                            : "text-text-secondary "
                        }`}
                      />
                      <span className="text-base">{route.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Settings"
                  className="group text-text-secondary hover:text-primary hover:bg-background-interface transition-colors duration-200"
                >
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-6 py-3"
                  >
                    <Settings className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors duration-200" />
                    <span className="text-base">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Profile"
                  className="group text-text-secondary hover:text-primary hover:bg-background-interface transition-colors duration-200"
                >
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-6 py-3"
                  >
                    <User className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors duration-200" />
                    <span className="text-base">Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Logout"
                  className="group text-text-secondary hover:text-white hover:bg-error transition-colors duration-200"
                >
                  <button
                    onClick={() =>
                      signOut({ callbackUrl: window.location.origin })
                    }
                    className="flex  w-full items-center gap-3 px-6 py-3"
                  >
                    <LogOut className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors duration-200" />
                    <span className="text-base">Logout</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background-interface px-6">
            <SidebarTrigger />
            <div className="w-full flex-1">
              <h1 className="text-xl font-semibold text-text-primary">
                {routes.find((route) => route.href === pathname)?.name ||
                  "Dashboard"}
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto h-10 gap-2 border-border text-text-primary hover:bg-background-panel hover:text-primary transition-colors duration-200"
            >
              <User className="h-5 w-5" />
              <span className="hidden sm:inline text-base">
                {session?.user?.name || "User"}
              </span>
            </Button>
          </header>
          <main className="flex-1 overflow-auto bg-background p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
