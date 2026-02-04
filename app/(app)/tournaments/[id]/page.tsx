"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import { Plus, Play, Settings, Loader2, Calendar, MapPin, Trophy, Users, Hash, Edit3, Activity, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import MatchRow from "@/components/dashboard/MatchRow";

interface TournamentData {
    id: string;
    name: string;
    location: string;
    startDate: string;
    category: string;
    scoringType: string;
    status: string;
    owner: { displayName: string } | null;
}

interface Match {
    id: string;
    status: string;
    team1: string;
    team2: string;
    court: string;
    startTime?: string;
}

export default function TournamentDashboard({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const tournamentId = resolvedParams.id;

    const [tournament, setTournament] = useState<TournamentData | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0 });

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

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-[#FF5A09]" size={32} /></div>;
    if (!tournament) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="p-10 text-center text-sm uppercase tracking-widest font-bold">
                    Tournament not found
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full mx-auto px-6 md:px-10 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            <div className="flex items-center gap-2 mb-6">
                <Link href="/tournaments" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#FF5A09] transition-colors">Tournaments</Link>
                <span className="text-slate-300 text-xs">/</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Management Dashboard</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT COLUMN */}
                <aside className="lg:col-span-4 space-y-4 sticky top-8">
                    <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
                        <div className="inline-flex items-center px-2 py-1 rounded-md bg-[#FF5A09]/10 text-[#FF5A09] text-[9px] font-black uppercase tracking-tighter mb-4">
                            {tournament.status}
                        </div>

                        <h1 className="text-4xl font-instrument font-medium tracking-tight mb-2 leading-tight">
                            {tournament.name}
                        </h1>

                        <div className="space-y-4 mt-8">
                            <DetailRow icon={<MapPin size={14} />} label="Location" value={tournament.location} />
                            <DetailRow icon={<Calendar size={14} />} label="Start Date" value={tournament.startDate} />
                            <DetailRow icon={<Trophy size={14} />} label="Category" value={tournament.category} />
                            <DetailRow icon={<Hash size={14} />} label="Scoring" value={tournament.scoringType} />
                            <DetailRow icon={<Users size={14} />} label="Organized by" value={tournament.owner?.displayName || "Admin"} />
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
                    </div>

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

                {/* RIGHT COLUMN */}
                <main className="lg:col-span-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Match Schedule</h2>
                        <div className="h-px flex-1 bg-slate-100 dark:bg-white/5 mx-6" />
                        <button aria-label="Settings" className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-black dark:hover:white transition-colors">
                            <Settings size={16} />
                        </button>
                    </div>

                    <div className="bg-white dark:bg-[#1A1A1A]/40 border border-slate-200 dark:border-white/5 rounded-4xl min-h-[400px] overflow-hidden">
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
                </main>
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
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{value}</span>
        </div>
    );
}