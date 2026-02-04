"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    MoreHorizontal,
    Trash2,
    Check,
    X,
    Edit2,
    Loader2,
    MonitorPlay,
    Clock,
    MapPin,
    Trophy
} from 'lucide-react';
import { auth } from "@/lib/firebase/client";

interface Match {
    id: string;
    status: string;
    player1: { name: string };
    player2: { name: string };
    court: string;
    startTime?: string;
}

interface MatchCardProps {
    match: Match;
    tournamentId: string;
    onMutation: () => void;
}

export default function MatchCard({ match, tournamentId, onMutation }: MatchCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [editData, setEditData] = useState({
        status: match.status,
        court: match.court
    });

    const isLive = match.status === "live" || match.status === "in_progress";

    const getAuthHeaders = async () => {
        const user = auth.currentUser;
        if (!user) throw new Error("Unauthorized");
        const token = await user.getIdToken();
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
    };

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ matchId: match.id, ...editData })
            });
            if (res.ok) {
                setIsEditing(false);
                onMutation();
            }
        } catch (err) {
            console.error("Update failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this match?")) return;
        setIsLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
                method: "DELETE",
                headers,
                body: JSON.stringify({ matchId: match.id })
            });
            if (res.ok) onMutation();
        } catch (err) {
            console.error("Delete failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-[#1A1A1A] border border-slate-100 dark:border-white/5 rounded-2xl p-4 shadow-sm relative overflow-hidden group">

            {/* STATUS STRIP */}
            {isLive && (
                <div className="absolute top-0 left-0 w-1 h-full bg-[#FF5A09]" />
            )}

            <div className="flex justify-between items-start mb-4 pl-2">
                {isEditing ? (
                    <select
                        value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase p-1.5 rounded focus:outline-none focus:ring-1 focus:ring-[#FF5A09]"
                    >
                        <option value="scheduled">Scheduled</option>
                        <option value="live">Live</option>
                        <option value="completed">Completed</option>
                    </select>
                ) : (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${isLive
                            ? "bg-[#FF5A09]/10 text-[#FF5A09]"
                            : "bg-slate-100 dark:bg-white/5 text-slate-500"
                        }`}>
                        {isLive && <span className="w-1.5 h-1.5 bg-[#FF5A09] rounded-full animate-pulse" />}
                        {match.status}
                    </div>
                )}

                {/* ACTION MENU */}
                <div className="flex items-center gap-1">
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin text-slate-400" />
                    ) : isEditing ? (
                        <div className="flex gap-1">
                            <button onClick={handleUpdate} className="p-1.5 bg-green-500/10 text-green-600 rounded-lg">
                                <Check size={14} />
                            </button>
                            <button onClick={() => setIsEditing(false)} className="p-1.5 bg-red-500/10 text-red-600 rounded-lg">
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <Link
                                href={`/overlay/matches/${match.id}`}
                                target="_blank"
                                className="p-2 text-slate-400 hover:text-[#FF5A09] hover:bg-[#FF5A09]/5 rounded-lg transition-colors"
                            >
                                <MonitorPlay size={14} />
                            </Link>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* PLAYERS */}
            <div className="flex flex-col gap-3 py-2 pl-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {match.player1?.name || 'Player 1'}
                    </span>
                    {/* Placeholder for scores if available in future */}
                </div>
                <div className="h-px bg-slate-50 dark:bg-white/5 w-full" />
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {match.player2?.name || 'Player 2'}
                    </span>
                </div>
            </div>

            {/* FOOTER INFO */}
            <div className="flex items-center gap-4 mt-4 pl-2 pt-2 border-t border-slate-50 dark:border-white/5 text-[10px] text-slate-400 uppercase font-bold tracking-wide">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <MapPin size={12} />
                        <input
                            type="text"
                            value={editData.court}
                            onChange={(e) => setEditData({ ...editData, court: e.target.value })}
                            className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/20 w-16 focus:outline-none focus:border-[#FF5A09]"
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <MapPin size={12} />
                        <span>{match.court || 'TBD'}</span>
                    </div>
                )}

                {match.startTime && (
                    <div className="flex items-center gap-1.5 ml-auto">
                        <Clock size={12} />
                        <span>{match.startTime}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
