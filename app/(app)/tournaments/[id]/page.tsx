"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import { Plus, Play, Settings, Calendar, MapPin, Trophy, Users, Hash, Edit3, Activity, Layers, LayoutGrid, List, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import MatchRow from "@/components/dashboard/MatchRow";
import MatchCard from "@/components/dashboard/MatchCard"; // New component
import SponsorsTab from "@/components/dashboard/SponsorsTab"; // New component
import DashboardLoader from "@/components/dashboard/loader";
import { Match } from "@/types/match";

interface TournamentData {
    id: string;
    name: string;
    location: string;
    startDate: string;
    endDate?: string;
    category?: string;
    type?: string;
    scoringType: string;
    status: string;
    owner: { displayName: string } | null;
}



export default function TournamentDashboard({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const tournamentId = resolvedParams.id;

    const [tournament, setTournament] = useState<TournamentData | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0 });
    const [activeTab, setActiveTab] = useState<"matches" | "overview" | "sponsors">("matches");

    const fetchData = useCallback(async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();
            const headers = { Authorization: `Bearer ${token}` };

            const [tRes, mRes] = await Promise.all([
                fetch(`/api/tournaments/${tournamentId}`, { headers }),
                fetch(`/api/tournaments/${tournamentId}/matches`, { headers })
            ]);

            if (tRes.ok) setTournament(await tRes.json());

            if (mRes.ok) {
                const matchData = await mRes.json();
                setMatches(matchData);
                setStats({
                    total: matchData.length,
                    active: matchData.filter((m: any) => m.status === "live" || m.status === "in_progress").length
                });
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, [tournamentId]);

    useEffect(() => {
        fetchData();
    }, [tournamentId]);

    if (loading) return <DashboardLoader message="Loading Tournament..." />;
    if (!tournament) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="p-10 text-center text-sm uppercase tracking-widest font-bold text-slate-400">
                    Tournament not found
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full mx-auto pb-20 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* MOBILE HEADER & TABS */}
            <div className="md:hidden sticky top-0 z-20 bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-instrument font-medium tracking-tight mb-1 truncate">
                        {tournament.name}
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        <span className={`px-2 py-0.5 rounded-full ${tournament.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-slate-100 dark:bg-white/10'}`}>
                            {tournament.status}
                        </span>
                        <span>•</span>
                        <span>{tournament.location}</span>
                    </div>
                </div>

                <div className="flex px-6 border-t border-slate-100 dark:border-white/5">
                    <button
                        onClick={() => setActiveTab("matches")}
                        className={`flex-1 py-3 text-[11px] uppercase font-bold tracking-widest border-b-2 transition-colors ${activeTab === "matches"
                            ? "border-[#FF5A09] text-[#FF5A09]"
                            : "border-transparent text-slate-400"
                            }`}
                    >
                        Matches
                    </button>
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`flex-1 py-3 text-[11px] uppercase font-bold tracking-widest border-b-2 transition-colors ${activeTab === "overview"
                            ? "border-[#FF5A09] text-[#FF5A09]"
                            : "border-transparent text-slate-400"
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("sponsors")}
                        className={`flex-1 py-3 text-[11px] uppercase font-bold tracking-widest border-b-2 transition-colors ${activeTab === "sponsors"
                            ? "border-[#FF5A09] text-[#FF5A09]"
                            : "border-transparent text-slate-400"
                            }`}
                    >
                        Sponsors
                    </button>
                </div>
            </div>

            <div className="px-4 md:px-10 py-6 md:py-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN (Desktop: Sidebar, Mobile: Overview Tab) */}
                    <aside className={`lg:col-span-4 space-y-4 lg:block ${activeTab === 'overview' ? 'block' : 'hidden'}`}>
                        {/* MAIN INFO CARD */}
                        <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
                            <div className="hidden md:inline-flex items-center px-2 py-1 rounded-md bg-[#FF5A09]/10 text-[#FF5A09] text-[9px] font-black uppercase tracking-tighter mb-4">
                                {tournament.status}
                            </div>

                            <h1 className="hidden md:block text-4xl font-instrument font-medium tracking-tight mb-2 leading-tight">
                                {tournament.name}
                            </h1>

                            <div className="space-y-4 mt-2 md:mt-8">
                                <DetailRow icon={<MapPin size={14} />} label="Location" value={tournament.location} />
                                <DetailRow icon={<Calendar size={14} />} label="Dates" value={`${tournament.startDate}${tournament.endDate ? ` - ${tournament.endDate}` : ''}`} />
                                <DetailRow icon={<Trophy size={14} />} label="Type" value={tournament.type || tournament.category || "Individual"} />
                                <DetailRow icon={<Hash size={14} />} label="Scoring" value={tournament.scoringType || "Standard"} />
                                <DetailRow icon={<Users size={14} />} label="Added by" value={tournament.owner?.displayName || "Admin"} />
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-10">
                                <Link
                                    href={`/tournaments/${tournamentId}/edit`}
                                    className="flex items-center justify-center gap-2 h-12 rounded-2xl border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                >
                                    <Edit3 size={14} /> Edit
                                </Link>
                                <button
                                    onClick={() => router.push(`/tournaments/${tournamentId}/matches/new`)}
                                    className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-[#FF5A09] text-white text-[10px] font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all"
                                >
                                    <Plus size={14} /> Add Match
                                </button>
                            </div>

                            <div className="hidden lg:flex flex-col gap-2 mt-6">
                                <button
                                    onClick={() => setActiveTab("matches")}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'matches' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-bold' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                >
                                    <List size={16} />
                                    <span className="text-xs uppercase tracking-widest">Matches</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("sponsors")}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'sponsors' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-bold' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                >
                                    <ImageIcon size={16} />
                                    <span className="text-xs uppercase tracking-widest">Sponsors</span>
                                </button>
                            </div>
                        </div>

                        {/* STATS */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                                    <Layers size={14} className="text-slate-400" />
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Matches</p>
                                <p className="text-3xl font-instrument mt-1">{stats.total}</p>
                            </div>

                            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 border border-[#FF5A09]/20 dark:border-[#FF5A09]/20 shadow-sm relative overflow-hidden">
                                <div className="w-8 h-8 rounded-xl bg-[#FF5A09]/10 flex items-center justify-center mb-4">
                                    <Activity size={14} className="text-[#FF5A09]" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Now</p>
                                    {stats.active > 0 && <span className="w-1.5 h-1.5 bg-[#FF5A09] rounded-full animate-ping" />}
                                </div>
                                <p className="text-3xl font-instrument mt-1 text-[#FF5A09]">{stats.active}</p>
                            </div>
                        </div>
                    </aside>

                    {/* RIGHT COLUMN (Matches) */}
                    <main className={`lg:col-span-8 flex flex-col gap-6 ${activeTab === 'matches' ? 'flex' : 'hidden'} ${activeTab === 'sponsors' ? 'lg:hidden' : 'lg:flex'}`}>
                        <div className="flex items-center justify-between px-2 hidden md:flex">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Match Schedule</h2>
                            <div className="h-px flex-1 bg-slate-100 dark:bg-white/5 mx-6" />
                            <div className="flex gap-2">
                                <button aria-label="Settings" className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-black dark:hover:white transition-colors">
                                    <Settings size={16} />
                                </button>
                            </div>
                        </div>

                        {/* DESKTOP TABLE VIEW */}
                        <div className="hidden md:block bg-white dark:bg-[#1A1A1A]/40 border border-slate-200 dark:border-white/5 rounded-4xl min-h-[400px] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-white/5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                            <th className="px-8 py-5">Status</th>
                                            <th className="px-8 py-5">Matchup</th>
                                            <th className="px-8 py-5">Court</th>
                                            <th className="px-8 py-5 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                        {matches.length > 0 ? (
                                            matches.map((match) => (
                                                <MatchRow
                                                    key={match.id} match={match} tournamentId={tournamentId} onMutation={fetchData} />
                                            ))
                                        ) : (
                                            <tr>
                                                <td className="px-8 py-20 text-center text-slate-400 text-[10px] uppercase font-bold tracking-widest italic" colSpan={4}>
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center">
                                                            <Play size={16} className="text-slate-300" />
                                                        </div>
                                                        No matches found.
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* MOBILE CARD VIEW */}
                        <div className="md:hidden space-y-3">
                            {matches.length > 0 ? (
                                matches.map((match) => (
                                    <MatchCard
                                        key={match.id} match={match} tournamentId={tournamentId} onMutation={fetchData} />
                                ))
                            ) : (
                                <div className="py-20 text-center text-slate-400 text-[10px] uppercase font-bold tracking-widest italic">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center">
                                            <Play size={16} className="text-slate-300" />
                                        </div>
                                        No matches scheduled yet.
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>

                    {/* SPONSORS TAB CONTENT */}
                    <div className={`lg:col-span-8 ${activeTab === 'sponsors' ? 'block' : 'hidden'}`}>
                        <SponsorsTab tournamentId={tournamentId} />
                    </div>
                </div>
            </div>

            {/* MOBILE FAB FOR ADD MATCH */}
            <div className={`md:hidden fixed bottom-6 right-6 z-30 ${activeTab === 'sponsors' ? 'hidden' : 'block'}`}>
                <button
                    onClick={() => router.push(`/tournaments/${tournamentId}/matches/new`)}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-[#FF5A09] text-white shadow-xl shadow-[#FF5A09]/30 hover:scale-105 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>
        </div>
    );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
                <div className="text-slate-300 group-hover:text-[#FF5A09] transition-colors">{icon}</div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[50%] text-right truncate">{value}</span>
        </div>
    );
}