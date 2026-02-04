"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    Clock,
    MapPin,
    Activity,
    Loader2,
    Save,
    Settings // Added missing import
} from "lucide-react";
import { auth } from "@/lib/firebase/client";

interface Match {
    id: string;
    team1: string;
    team2: string;
    score1?: number;
    score2?: number;
    status: string;
    court: string;
    startTime?: string;
    notes?: string;
}

export default function MatchDetailsPage({
    params
}: {
    params: Promise<{ id: string; matchId: string }>
}) {
    const router = useRouter();
    const { id: tournamentId, matchId } = use(params);

    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchMatch = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;
                const token = await user.getIdToken();

                const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const matches: Match[] = await res.json();
                    const found = matches.find(m => m.id === matchId);
                    setMatch(found || null);
                }
            } catch (error) {
                console.error("Error fetching match:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMatch();
    }, [tournamentId, matchId]);

    const handleUpdateMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!match) return;
        setSaving(true);
        try {
            const user = auth.currentUser;
            const token = await user?.getIdToken();
            const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ matchId: match.id, ...match }),
            });
            if (res.ok) router.refresh();
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-[#FF5A09]" size={32} /></div>;
    if (!match) return <div className="p-20 text-center">Match not found.</div>;

    return (
        <div className="max-w-4xl mx-auto px-6 py-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href={`/tournaments/${tournamentId}`}
                    className="p-2 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-[#FF5A09]/10 hover:text-[#FF5A09] transition-all"
                    aria-label="Back to tournament"
                >
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Match Management</h2>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Tournament Dashboard / Details</p>
                </div>
            </div>

            <form onSubmit={handleUpdateMatch} className="space-y-6">
                <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${match.status === 'live' ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                            }`}>
                            <Activity size={12} /> {match.status}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8 mt-4">
                        <div className="text-center md:text-right">
                            <label htmlFor="score1" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Team One Score</label>
                            <h3 className="text-2xl font-instrument mb-4">{match.team1}</h3>
                            <input
                                id="score1"
                                type="number"
                                title={`${match.team1} Score`}
                                value={match.score1 ?? 0}
                                onChange={(e) => setMatch({ ...match, score1: parseInt(e.target.value) })}
                                className="w-20 text-center text-4xl font-instrument bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-2 focus:ring-2 focus:ring-[#FF5A09]"
                            />
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 font-bold">VS</div>
                        </div>

                        <div className="text-center md:text-left">
                            <label htmlFor="score2" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Team Two Score</label>
                            <h3 className="text-2xl font-instrument mb-4">{match.team2}</h3>
                            <input
                                id="score2"
                                type="number"
                                title={`${match.team2} Score`}
                                value={match.score2 ?? 0}
                                onChange={(e) => setMatch({ ...match, score2: parseInt(e.target.value) })}
                                className="w-20 text-center text-4xl font-instrument bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-2 focus:ring-2 focus:ring-[#FF5A09]"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/5 rounded-3xl p-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <Settings size={14} /> Match Settings
                        </h4>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="status-select" className="text-[10px] font-bold text-slate-500 uppercase px-1">Current Status</label>
                                <select
                                    id="status-select"
                                    title="Match Status"
                                    value={match.status}
                                    onChange={(e) => setMatch({ ...match, status: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border-none text-sm font-medium"
                                >
                                    <option value="scheduled">Scheduled</option>
                                    <option value="live">Live / In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="court-input" className="text-[10px] font-bold text-slate-500 uppercase px-1">Court / Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
                                    <input
                                        id="court-input"
                                        type="text"
                                        title="Court Location"
                                        placeholder="Enter court name"
                                        value={match.court}
                                        onChange={(e) => setMatch({ ...match, court: e.target.value })}
                                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-white/5 border-none text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/5 rounded-3xl p-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <Clock size={14} /> Schedule & Notes
                        </h4>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="start-time" className="text-[10px] font-bold text-slate-500 uppercase px-1">Start Time</label>
                                <input
                                    id="start-time"
                                    type="text"
                                    title="Start Time"
                                    placeholder="e.g. 10:00 AM"
                                    value={match.startTime || ""}
                                    onChange={(e) => setMatch({ ...match, startTime: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border-none text-sm font-medium"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="admin-notes" className="text-[10px] font-bold text-slate-500 uppercase px-1">Admin Notes</label>
                                <textarea
                                    id="admin-notes"
                                    title="Match Notes"
                                    rows={1}
                                    value={match.notes || ""}
                                    onChange={(e) => setMatch({ ...match, notes: e.target.value })}
                                    placeholder="Add match notes..."
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border-none text-sm font-medium resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Discard Changes
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-8 h-14 rounded-2xl bg-[#FF5A09] text-white text-[10px] font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={14} aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
                        Save Match Details
                    </button>
                </div>
            </form>
        </div>
    );
} 