"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    MoreHorizontal,
    Trash2,
    Edit2,
    Loader2,
    MonitorPlay,
    Clock,
    MapPin,
    AlertCircle
} from 'lucide-react';
import { auth } from "@/lib/firebase/client";
import { Match } from "@/types/match";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MatchCardProps {
    match: Match;
    tournamentId: string;
    onMutation: () => void;
}

export default function MatchCard({ match, tournamentId, onMutation }: MatchCardProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const isLive = match.status === "live";

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Unauthorized");
            const token = await user.getIdToken();

            const res = await fetch(`/api/tournaments/${tournamentId}/matches/${match.id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ matchId: match.id })
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Match deleted successfully");
            onMutation();
            setShowDeleteModal(false);
        } catch (err) {
            console.error("Delete failed", err);
            toast.error("Failed to delete match");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-[#1A1A1A] border border-slate-100 dark:border-white/5 rounded-2xl p-4 shadow-sm relative overflow-hidden group">

                {/* STATUS STRIP */}
                {isLive && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#FF5A09]" />
                )}

                <div className="flex justify-between items-start mb-4 pl-2">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${isLive
                        ? "bg-[#FF5A09]/10 text-[#FF5A09]"
                        : "bg-slate-100 dark:bg-white/5 text-slate-500"
                        }`}>
                        {isLive && <span className="w-1.5 h-1.5 bg-[#FF5A09] rounded-full animate-pulse" />}
                        {match.status || 'Scheduled'}
                    </div>

                    {/* ACTION MENU */}
                    <div className="flex items-center gap-1">
                        <Link
                            href={`/overlay/matches/${match.id}`}
                            target="_blank"
                            title="Open Overlay"
                            className="p-2 text-slate-400 hover:text-[#FF5A09] hover:bg-[#FF5A09]/5 rounded-lg transition-colors"
                        >
                            <MonitorPlay size={14} />
                        </Link>

                        <Link
                            href={`/tournaments/${tournamentId}/matches/${match.id}`}
                            title="Manage Match"
                            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <MoreHorizontal size={14} />
                        </Link>

                        <Link
                            href={`/tournaments/${tournamentId}/matches/${match.id}/edit`}
                            title="Edit Match"
                            className="p-2 text-slate-400 hover:text-[#FF5A09] hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <Edit2 size={14} />
                        </Link>

                        <button
                            onClick={() => setShowDeleteModal(true)}
                            title="Delete Match"
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* PLAYERS */}
                <div className="flex flex-col gap-3 py-2 pl-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 italic">
                            {match.player1?.name2 ? `${match.player1.name} / ${match.player1.name2}` : match.player1?.name || 'Player 1'}
                        </span>
                    </div>
                    <div className="h-px bg-slate-50 dark:bg-white/5 w-full" />
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 italic">
                            {match.player2?.name2 ? `${match.player2.name} / ${match.player2.name2}` : match.player2?.name || 'Player 2'}
                        </span>
                    </div>
                </div>

                {/* FOOTER INFO */}
                <div className="flex items-center gap-4 mt-4 pl-2 pt-2 border-t border-slate-50 dark:border-white/5 text-[10px] text-slate-400 uppercase font-bold tracking-wide">
                    <div className="flex items-center gap-1.5">
                        <MapPin size={12} />
                        <span>{match.court || 'TBD'}</span>
                    </div>

                    {match.matchTime && (
                        <div className="flex items-center gap-1.5 ml-auto text-[#FF5A09]">
                            <Clock size={12} />
                            <span>{match.matchTime}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* DELETE MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-slate-200 dark:border-white/10 p-6 md:p-8 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                                <AlertCircle size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Match?</h3>
                                <p className="text-xs text-slate-500 normal-case tracking-normal">This action cannot be undone. The match data will be permanently removed.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full mt-2">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    className="h-10 rounded-xl bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={14} /> : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
