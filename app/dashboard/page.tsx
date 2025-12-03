"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  BarChart3, 
  FileImage, 
  Monitor, 
  PlayCircle, 
  Plus, 
  TrendingUp,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowRight,
  Activity,
  Wifi,
  WifiOff,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface Playlist {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface Asset {
  _id: string;
  name: string;
  type: string;
  createdAt: string;
}

interface Display {
  _id: string;
  name: string;
  deviceId: string;
  location?: string;
  status: 'online' | 'offline' | 'error';
  lastActive: string;
  playlistId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient,
  trend,
  delay = 0 
}: { 
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  trend?: { value: number; label: string };
  delay?: number;
}) {
  return (
    <div 
      className="stat-card group fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Gradient Orb Background */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-3xl group-hover:opacity-30 transition-opacity duration-500`} />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`icon-badge bg-gradient-to-br ${gradient}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend.value >= 0 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'bg-red-500/10 text-red-400'
            }`}>
              <TrendingUp className={`h-3 w-3 ${trend.value < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-white/50">{title}</p>
          <p className="text-3xl font-bold text-white counter">{value}</p>
          <p className="text-xs text-white/40">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// Display Status Card
function DisplayStatusCard({ display, delay = 0 }: { display: Display; delay?: number }) {
  const lastActiveDate = display.lastActive ? new Date(display.lastActive) : null;
  const isValid = lastActiveDate && !isNaN(lastActiveDate.getTime());
  const diffMs = isValid ? Date.now() - lastActiveDate.getTime() : Number.POSITIVE_INFINITY;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const isOnline = isValid && diffMins <= 5;

  let timeAgo = 'Never';
  if (isValid) {
    if (diffMins < 1) timeAgo = 'Just now';
    else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
    else {
      const hours = Math.floor(diffMins / 60);
      const days = Math.floor(hours / 24);
      if (days > 0) timeAgo = `${days}d ago`;
      else timeAgo = `${hours}h ago`;
    }
  }

  return (
    <div 
      className="group relative p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="relative">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isOnline 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : 'bg-white/5 text-white/40'
          }`}>
            <Monitor className="h-5 w-5" />
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[hsl(222,47%,6%)] ${
            isOnline ? 'bg-emerald-500' : 'bg-white/20'
          }`}>
            {isOnline && (
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
            )}
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{display.name}</p>
          <p className="text-xs text-white/40 truncate">
            {display.location || display.deviceId}
          </p>
        </div>
        
        {/* Status & Time */}
        <div className="text-right">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isOnline 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : 'bg-white/5 text-white/40'
          }`}>
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
          <p className="text-[11px] text-white/30 mt-1">{timeAgo}</p>
        </div>
      </div>
      
      {/* Playing Info */}
      {display.playlistId && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <PlayCircle className="h-3 w-3" />
            <span className="truncate">Playing: {display.playlistId.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick Action Button
function QuickActionButton({ 
  icon: Icon, 
  label, 
  href, 
  gradient,
  delay = 0 
}: { 
  icon: React.ElementType;
  label: string;
  href: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <Link href={href}>
      <button 
        className="group relative w-full p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 fade-in-up overflow-hidden"
        style={{ animationDelay: `${delay}s` }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
        <div className="relative flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <span className="font-medium text-white/80 group-hover:text-white transition-colors">
            {label}
          </span>
          <ArrowRight className="ml-auto h-4 w-4 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
        </div>
      </button>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [numAssets, setNumAssets] = useState(0);
  const [numPlaylists, setNumPlaylists] = useState(0);
  const [numDisplays, setNumDisplays] = useState(0);
  const [onlineDisplays, setOnlineDisplays] = useState(0);
  const [recentPlaylists, setRecentPlaylists] = useState<Playlist[]>([]);
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, playlistsRes, displaysRes] = await Promise.all([
          fetch("/api/assets", { credentials: "include" }),
          fetch("/api/playlists", { credentials: "include" }),
          fetch("/api/displays", { credentials: "include" }),
        ]);

        if (!assetsRes.ok || !playlistsRes.ok || !displaysRes.ok) {
          if (assetsRes.status === 401 || playlistsRes.status === 401 || displaysRes.status === 401) {
            router.push("/login");
            return;
          }
        }

        const [assets, playlists, displayList] = await Promise.all([
          assetsRes.json(),
          playlistsRes.json(),
          displaysRes.json(),
        ]);

        if (Array.isArray(assets)) {
          setNumAssets(assets.length);
          setRecentAssets(assets.slice(0, 5));
        }

        if (Array.isArray(playlists)) {
          setNumPlaylists(playlists.length);
          setRecentPlaylists(playlists.slice(0, 4));
        }

        if (Array.isArray(displayList)) {
          setNumDisplays(displayList.length);
          setDisplays(displayList);
          
          // Calculate online displays
          const online = displayList.filter((d: Display) => {
            if (!d.lastActive) return false;
            const lastActive = new Date(d.lastActive);
            const diffMins = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60));
            return diffMins <= 5;
          });
          setOnlineDisplays(online.length);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {getGreeting()} <span className="wave">👋</span>
          </h1>
          <p className="text-white/50">
            Here's what's happening with your digital signage network today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
            <Calendar className="h-4 w-4 text-white/40" />
            <span className="text-sm text-white/60">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Assets"
          value={isLoading ? "..." : numAssets}
          subtitle="Media files uploaded"
          icon={FileImage}
          gradient="from-pink-500 to-rose-500"
          delay={0.1}
        />
        <StatCard
          title="Active Playlists"
          value={isLoading ? "..." : numPlaylists}
          subtitle="Content sequences"
          icon={PlayCircle}
          gradient="from-cyan-500 to-blue-500"
          delay={0.2}
        />
        <StatCard
          title="Total Displays"
          value={isLoading ? "..." : numDisplays}
          subtitle="Connected screens"
          icon={Monitor}
          gradient="from-violet-500 to-purple-500"
          delay={0.3}
        />
        <StatCard
          title="Online Now"
          value={isLoading ? "..." : onlineDisplays}
          subtitle={`${numDisplays > 0 ? Math.round((onlineDisplays / numDisplays) * 100) : 0}% uptime`}
          icon={Activity}
          gradient="from-emerald-500 to-green-500"
          trend={numDisplays > 0 ? { value: Math.round((onlineDisplays / numDisplays) * 100), label: "active" } : undefined}
          delay={0.4}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Displays Status - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Display Status</h2>
              <p className="text-sm text-white/40">Real-time network monitoring</p>
            </div>
            <Link href="/dashboard/displays">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white/60 hover:text-white hover:bg-white/5"
              >
                View All
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : displays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-white/[0.02] border border-white/5">
              <Monitor className="h-12 w-12 text-white/20 mb-4" />
              <p className="text-white/40 mb-4">No displays connected yet</p>
              <Link href="/dashboard/displays/new">
                <Button size="sm" className="bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Display
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displays.slice(0, 6).map((display, i) => (
                <DisplayStatusCard key={display._id} display={display} delay={0.1 + i * 0.05} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            <p className="text-sm text-white/40">Common tasks</p>
          </div>
          
          <div className="space-y-2">
            <QuickActionButton
              icon={Plus}
              label="Upload Asset"
              href="/dashboard/assets/new"
              gradient="from-pink-500 to-rose-500"
              delay={0.1}
            />
            <QuickActionButton
              icon={PlayCircle}
              label="Create Playlist"
              href="/dashboard/playlists/new"
              gradient="from-cyan-500 to-blue-500"
              delay={0.15}
            />
            <QuickActionButton
              icon={Monitor}
              label="Add Display"
              href="/dashboard/displays/new"
              gradient="from-violet-500 to-purple-500"
              delay={0.2}
            />
            <QuickActionButton
              icon={BarChart3}
              label="View Analytics"
              href="/dashboard/analytics"
              gradient="from-amber-500 to-orange-500"
              delay={0.25}
            />
          </div>
        </div>
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Playlists */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Playlists</h2>
              <p className="text-sm text-white/40">Latest content sequences</p>
            </div>
            <Link href="/dashboard/playlists">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5">
                View All
              </Button>
            </Link>
          </div>
          
          <div className="divide-y divide-white/5">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-4">
                  <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                </div>
              ))
            ) : recentPlaylists.length === 0 ? (
              <div className="p-8 text-center text-white/40">
                No playlists yet
              </div>
            ) : (
              recentPlaylists.map((playlist, i) => (
                <div key={playlist._id} className="p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                      <PlayCircle className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{playlist.name}</p>
                      <p className="text-xs text-white/40 truncate">
                        {playlist.description || 'No description'}
                      </p>
                    </div>
                    <div className="text-xs text-white/30">
                      {new Date(playlist.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Assets */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden fade-in-up" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Assets</h2>
              <p className="text-sm text-white/40">Latest uploads</p>
            </div>
            <Link href="/dashboard/assets">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5">
                View All
              </Button>
            </Link>
          </div>
          
          <div className="divide-y divide-white/5">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-4">
                  <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                </div>
              ))
            ) : recentAssets.length === 0 ? (
              <div className="p-8 text-center text-white/40">
                No assets yet
              </div>
            ) : (
              recentAssets.map((asset, i) => (
                <div key={asset._id} className="p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
                      <FileImage className="h-5 w-5 text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{asset.name}</p>
                      <p className="text-xs text-white/40">{asset.type}</p>
                    </div>
                    <div className="text-xs text-white/30">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
