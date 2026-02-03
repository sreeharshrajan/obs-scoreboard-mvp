"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { AdminStats, ApiResponse } from "@/lib/types/admin";
import { Users, Trophy, GamepadDirectional, Loader2, LayoutDashboard, Plus } from "lucide-react";
import Link from "next/link";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export default function Dashboard() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = isAdmin ? "/api/admin/stats" : "/api/user/summary";
        const res = await fetch(endpoint);
        const json: ApiResponse<AdminStats> = await res.json();
        if (json.data) setMetrics(json.data);
      } catch (err) {
        console.error("Data Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#FF5A09]" size={28} />
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">Loading Dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-5 md:px-10 flex flex-col py-4 md:py-6 space-y-6 animate-in fade-in duration-500 overflow-hidden h-full">

      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
        <h1 className="text-2xl md:text-4xl font-instrument font-medium tracking-tight">
          Hello, <span className="italic font-light text-[#FF5A09]">{displayName}</span>
        </h1>

        {!isAdmin && (
          <Link
            href="/dashboard/tournaments/new"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-bold text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg active:scale-95"
          >
            <Plus size={14} /> <span className="inline">New Tournament</span>
          </Link>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 overflow-y-auto sm:overflow-visible pr-1 sm:pr-0 max-h-[40vh] sm:max-h-none">
        {isAdmin ? (
          <>
            <StatsCard title="Total Users" value={metrics?.totalUsers} icon={<Users size={18} />} color="blue" link="/dashboard/tournaments" />
            <StatsCard title="Global Tourneys" value={metrics?.activeTournaments} icon={<Trophy size={18} />} color="orange" />
            <StatsCard title="Total Matches" value={metrics?.totalMatches} icon={<GamepadDirectional size={18} />} color="dark" isPrimary />
          </>
        ) : (
          <>
            <StatsCard title="My Tournaments" value={metrics?.userTournaments} icon={<Trophy size={18} />} color="orange" link="/dashboard/tournaments"/>
            <StatsCard title="Live Matches" value={metrics?.liveMatches} icon={<GamepadDirectional size={18} />} color="blue" />
            <StatsCard title="Completed" value={metrics?.completedMatches} icon={<LayoutDashboard size={18} />} color="dark" />
          </>
        )}
      </div>

      {/* Activity Area - Expands to fill space */}
      <div className="flex-1 flex flex-col min-h-0">
        <ActivityFeed />
      </div>

    </div>
  );
}