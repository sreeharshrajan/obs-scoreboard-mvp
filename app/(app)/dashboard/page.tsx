"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { resolveRoles } from "@/lib/auth/roles";
import { AdminStats, ApiResponse } from "@/lib/types/admin";
import { Users, Trophy, GamepadDirectional, LayoutDashboard } from "lucide-react";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import PageSkeleton from "@/components/dashboard/page-skeleton";

export default function Dashboard() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const { isAdmin } = resolveRoles(user?.email || null);
  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = isAdmin ? "/api/admin/stats" : "/api/stats";
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
    return <PageSkeleton />;
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-5 md:px-10 flex flex-col py-4 md:py-6 space-y-6 animate-in fade-in duration-500 overflow-hidden h-full">



      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 overflow-y-auto sm:overflow-visible pr-1 sm:pr-0 max-h-[40vh] sm:max-h-none">
        {isAdmin ? (
          <>
            <StatsCard title="Total Users" value={metrics?.totalUsers} icon={<Users size={18} />} color="blue" link="tournaments" />
            <StatsCard title="Global Tourneys" value={metrics?.activeTournaments} icon={<Trophy size={18} />} color="orange" />
            <StatsCard title="Total Matches" value={metrics?.totalMatches} icon={<GamepadDirectional size={18} />} color="dark" isPrimary />
          </>
        ) : (
          <>
            <StatsCard title="My Tournaments" value={metrics?.userTournaments} icon={<Trophy size={18} />} color="orange" link="tournaments" />
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