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
    MonitorPlay // Added for the Overlay link
} from 'lucide-react';
import { auth } from "@/lib/firebase/client";

interface Match {
    id: string;
    status: string;
    team1: string;
    team2: string;
    court: string;
    startTime?: string;
}

interface MatchRowProps {
    match: Match;
    tournamentId: string;
    onMutation: () => void;
}

function MatchRow({ match, tournamentId, onMutation }: MatchRowProps) {
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
        <tr className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
            <td className="px-8 py-5">
                {isEditing ? (
                    <select
                        aria-label="Change match status"
                        title="Match Status"
                        value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase p-1 rounded focus:outline-none focus:ring-1 focus:ring-[#FF5A09]"
                    >
                        <option value="scheduled">Scheduled</option>
                        <option value="live">Live</option>
                        <option value="completed">Completed</option>
                    </select>
                ) : (
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${isLive ? "bg-red-500/10 text-red-500" : "bg-slate-100 dark:bg-white/5 text-slate-500"
                        }`}>
                        {isLive && <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />}
                        {match.status}
                    </div>
                )}
            </td>

            <td className="px-8 py-5">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {match.team1} <span className="text-slate-400 font-medium px-1">vs</span> {match.team2}
                    </span>
                    {match.startTime && <span className="text-[9px] text-slate-400 uppercase tracking-wide">{match.startTime}</span>}
                </div>
            </td>

            <td className="px-8 py-5">
                {isEditing ? (
                    <input
                        aria-label="Edit court location"
                        title="Court Location"
                        placeholder="Court"
                        type="text"
                        value={editData.court}
                        onChange={(e) => setEditData({ ...editData, court: e.target.value })}
                        className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase p-1 rounded w-20 focus:outline-none focus:ring-1 focus:ring-[#FF5A09]"
                    />
                ) : (
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {match.court || "TBD"}
                    </span>
                )}
            </td>

            <td className="px-8 py-5 text-right">
                <div className="flex justify-end items-center gap-2">
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin text-slate-400" />
                    ) : isEditing ? (
                        <>
                            <button
                                onClick={handleUpdate}
                                title="Save changes"
                                aria-label="Save changes"
                                className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-md transition-colors"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                title="Cancel editing"
                                aria-label="Cancel editing"
                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                            >
                                <X size={16} /></button>
                        </>
                    ) : (
                        <div className="flex items-center gap-1">
                            {/* PUBLIC OVERLAY LINK */}
                            <Link
                                href={`/overlay/matches/${match.id}`}
                                target="_blank"
                                title="Open Score Overlay"
                                aria-label="Open Score Overlay"
                                className="p-2 rounded-lg hover:bg-[#FF5A09]/10 text-slate-400 hover:text-[#FF5A09] transition-colors"
                            >
                                <MonitorPlay size={16} />
                            </Link>

                            <Link
                                href={`/tournaments/${tournamentId}/matches/${match.id}`}
                                title="View match details"
                                aria-label="View match details"
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors"
                            >
                                <MoreHorizontal size={16} />
                            </Link>

                            <button
                                onClick={() => setIsEditing(true)}
                                title="Quick edit match"
                                aria-label="Quick edit match"
                                className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[#FF5A09]"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={handleDelete}
                                title="Delete match"
                                aria-label="Delete match"
                                className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
}

export default MatchRow;