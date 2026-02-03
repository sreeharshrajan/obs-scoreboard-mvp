"use client";
import { Plus, Play, MoreHorizontal, Settings } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import Link from "next/link";

export default function TournamentDashboard({ params }: { params: { id: string } }) {
    const tournamentName = "";

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col py-6 space-y-8 animate-in fade-in duration-500">

            {/* Tournament Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF5A09] mb-1">Live Management</div>
                    <h1 className="text-4xl font-instrument font-medium tracking-tight">{tournamentName}</h1>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Tournament ID: {params.id}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="h-11 px-6 rounded-xl border border-slate-200 dark:border-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                        <Settings size={14} className="inline mr-2" /> Settings
                    </button>
                    <button className="h-11 px-6 rounded-xl bg-[#FF5A09] text-white text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#FF5A09]/20">
                        <Plus size={14} className="inline mr-2" /> Add Match
                    </button>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard title="Total Matches" value={12} icon={<Settings size={16} />} color="dark" />
                <StatsCard title="Completed" value={8} icon={<Settings size={16} />} color="blue" />
                <StatsCard title="Live Now" value={1} icon={<Play size={16} />} color="orange" isPrimary />
                <StatsCard title="Players" value={24} icon={<Settings size={16} />} color="dark" />
            </div>

            {/* Match Table */}
            <div className="flex-1 min-h-[400px] bg-white dark:bg-[#2A2A2A]/20 border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Match Schedule</h2>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Matchup</th>
                                <th className="px-8 py-4">Score</th>
                                <th className="px-8 py-4">Court</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {[1, 2, 3].map((match) => (
                                <tr key={match} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-5">
                                        <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-500 text-[8px] font-bold uppercase">Live</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-medium">Viktor Axelsen <span className="text-slate-400 mx-2 text-[10px]">vs</span> Lee Zii Jia</div>
                                    </td>
                                    <td className="px-8 py-5 font-instrument italic text-lg">21 - 19, 11 - 5</td>
                                    <td className="px-8 py-5 text-xs text-slate-500 font-bold uppercase">Court 01</td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-all">
                                            <MoreHorizontal size={16} className="text-slate-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}