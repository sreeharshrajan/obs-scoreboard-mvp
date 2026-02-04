"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    GamepadDirectional,
    Trash2,
    Edit2,
    MonitorPlay,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { auth } from "@/lib/firebase/client";
import { Match } from "@/types/match";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MatchRowProps {
    match: Match;
    tournamentId: string;
    onMutation: () => void;
}

function MatchRow({ match, tournamentId, onMutation }: MatchRowProps) {
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

            const res = await fetch(`/api/tournaments/${tournamentId}/matches/${match.id}`, { // Updated route to be specific if needed, or keeping generic delete body
                // NOTE: Original implementation used DELETE on collection with body. 
                // Standard REST usually prefers DELETE /id. 
                // Checking if API supports /matches/[id] DELETE. 
                // If not, using original logic but with sonner.
                // Assuming generic endpoint for now based on previous code.
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
            <tr className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${isLive ? "bg-red-500/10 text-red-500" : "bg-slate-100 dark:bg-white/5 text-slate-500"
                        }`}>
                        {isLive && <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />}
                        {match.status || 'Scheduled'}
                    </div>
                </td>

                <td className="px-8 py-5">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {match.player1?.name2 ? `${match.player1.name} / ${match.player1.name2}` : match.player1?.name || 'P1'}
                            <span className="text-slate-400 font-medium px-2 italic">vs</span>
                            {match.player2?.name2 ? `${match.player2.name} / ${match.player2.name2}` : match.player2?.name || 'P2'}
                        </span>
                        {match.matchTime && <span className="text-[9px] text-[#FF5A09] font-bold uppercase tracking-wider mt-1">{match.matchTime}</span>}
                    </div>
                </td>

                <td className="px-8 py-5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {match.court || "TBD"}
                    </span>
                </td>

                <td className="px-8 py-5 text-right">
                    <div className="flex justify-end items-center gap-2">
                        {/* PUBLIC OVERLAY LINK */}
                        <Link
                            href={`/overlay/matches/${match.id}`}
                            target="_blank"
                            title="Open Score Overlay"
                            className="p-2 rounded-lg hover:bg-[#FF5A09]/10 text-slate-400 hover:text-[#FF5A09] transition-colors"
                        >
                            <MonitorPlay size={16} />
                        </Link>

                        {/* DASHBOARD LINK */}
                        <Link
                            href={`/tournaments/${tournamentId}/matches/${match.id}`}
                            title="Manage Match"
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors"
                        >
                            <GamepadDirectional size={16} />
                        </Link>

                        {/* EDIT LINK */}
                        <Link
                            href={`/tournaments/${tournamentId}/matches/${match.id}/edit`}
                            title="Edit Match"
                            className="p-2 transition-opacity text-slate-400 hover:text-[#FF5A09]"
                        >
                            <Edit2 size={14} />
                        </Link>

                        {/* DELETE BUTTON */}
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            title="Delete Match"
                            className="p-2 transition-opacity text-slate-400 hover:text-red-500"
                        >
                            <Trash2 size={14} />
                        </button>

                        {/* DELETE MODAL - Moved inside td to avoid tbody > div error */}
                        {showDeleteModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-default">
                                <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-slate-200 dark:border-white/10 p-6 md:p-8 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200 text-left">
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
                                                type="button"
                                                onClick={() => setShowDeleteModal(false)}
                                                className="h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
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
                    </div>
                </td>
            </tr>
        </>
    );
}

export default MatchRow;