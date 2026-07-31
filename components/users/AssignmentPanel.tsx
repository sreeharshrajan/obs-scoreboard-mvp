"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, Layers, ShieldCheck, AlertCircle } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import type { MatchAssignment, PermissionProfileName } from "@/lib/types/permissions";

interface Tournament {
    id: string;
    name: string;
}

interface Match {
    id: string;
    court?: string;
    player1?: { name: string };
    player2?: { name: string };
}

interface AssignmentPanelProps {
    userId: string;
    userName: string;
}

export function AssignmentPanel({ userId, userName }: AssignmentPanelProps) {
    const [assignments, setAssignments] = useState<MatchAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form state for new assignment
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState("");
    const [matches, setMatches] = useState<Match[]>([]);
    const [selectedMatchId, setSelectedMatchId] = useState<string>("all");
    const [permissionProfile, setPermissionProfile] = useState<PermissionProfileName>("scorer");
    const [submitting, setSubmitting] = useState(false);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();
            const res = await fetch(`/api/match-assignments?userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAssignments(data);
            }
        } catch (err) {
            console.error("Fetch assignments error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [userId]);

    // Load tournaments
    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;
                const token = await user.getIdToken();
                const res = await fetch("/api/tournaments", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTournaments(data);
                    if (data.length > 0 && !selectedTournamentId) {
                        setSelectedTournamentId(data[0].id);
                    }
                }
            } catch (err) {
                console.error("Fetch tournaments error:", err);
            }
        };
        fetchTournaments();
    }, [userId, isAdding]);

    // Load matches when tournament selection changes
    useEffect(() => {
        setSelectedMatchId("all");
        if (!isAdding || !selectedTournamentId) return;
        const fetchMatches = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;
                const token = await user.getIdToken();
                const res = await fetch(`/api/tournaments/${selectedTournamentId}/matches`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMatches(data);
                }
            } catch (err) {
                console.error("Fetch matches error:", err);
            }
        };
        fetchMatches();
    }, [isAdding, selectedTournamentId]);

    const handleAddAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const user = auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();

            const matchId = selectedMatchId === "all" ? null : selectedMatchId;

            const res = await fetch("/api/match-assignments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    tournamentId: selectedTournamentId,
                    matchId,
                    permissionProfile
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                alert(errData.error || "Failed to create assignment");
                return;
            }

            setIsAdding(false);
            fetchAssignments();
        } catch (err) {
            console.error("Add assignment error:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAssignment = async (assignmentId: string) => {
        if (!confirm("Are you sure you want to remove this assignment?")) return;
        try {
            const user = auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();

            const res = await fetch(`/api/match-assignments/${assignmentId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
            } else {
                const errData = await res.json();
                alert(errData.error || "Failed to delete assignment");
            }
        } catch (err) {
            console.error("Delete assignment error:", err);
        }
    };

    const tournamentMap = new Map(tournaments.map(t => [t.id, t.name]));

    return (
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#FF5A09]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">Assigned Matches & Tournaments</h3>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-3 py-1.5 rounded-xl bg-[#FF5A09]/10 text-[#FF5A09] text-[10px] font-bold uppercase tracking-widest hover:bg-[#FF5A09] hover:text-white transition-all flex items-center gap-1.5"
                    >
                        <Plus size={14} /> Add Assignment
                    </button>
                )}
            </div>

            {/* New Assignment Form */}
            {isAdding && (
                <form onSubmit={handleAddAssignment} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-[#FF5A09]/30 space-y-3 animate-in fade-in duration-300">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5A09]">New Assignment</p>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tournament</label>
                        <select
                            value={selectedTournamentId}
                            onChange={(e) => setSelectedTournamentId(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#2A2A2A] border border-slate-200 dark:border-white/10 text-xs font-semibold outline-none"
                        >
                            {tournaments.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Match Scope</label>
                        <select
                            value={selectedMatchId}
                            onChange={(e) => setSelectedMatchId(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#2A2A2A] border border-slate-200 dark:border-white/10 text-xs font-semibold outline-none"
                        >
                            <option value="all">★ All Matches in Tournament (Tournament-Wide)</option>
                            {matches.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.court || 'Court 1'}: {m.player1?.name || 'Player 1'} vs {m.player2?.name || 'Player 2'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Permission Profile</label>
                        <select
                            value={permissionProfile}
                            onChange={(e) => setPermissionProfile(e.target.value as PermissionProfileName)}
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#2A2A2A] border border-slate-200 dark:border-white/10 text-xs font-semibold outline-none capitalize"
                        >
                            <option value="scorer">Scorer</option>
                            <option value="referee">Referee</option>
                            <option value="broadcaster">Broadcaster</option>
                        </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 h-9 rounded-xl bg-[#FF5A09] text-white text-[10px] font-bold uppercase tracking-widest hover:shadow-md transition-all"
                        >
                            {submitting ? "Saving..." : "Save Assignment"}
                        </button>
                    </div>
                </form>
            )}

            {/* Assignments List */}
            {loading ? (
                <p className="text-xs text-slate-400 animate-pulse py-4 text-center">Loading assignments...</p>
            ) : assignments.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {assignments.map((assignment) => (
                        <div
                            key={assignment.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-[#FF5A09]/30 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#FF5A09]/10 text-[#FF5A09] flex items-center justify-center">
                                    <Layers size={14} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold capitalize">{assignment.permissionProfile}</span>
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                                            {assignment.scope === "tournament" ? "All Matches" : "Single Match"}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                        Tournament: {tournamentMap.get(assignment.tournamentId) || `${assignment.tournamentId.slice(0, 8)}...`}
                                        {assignment.matchId && ` • Match: ${assignment.matchId.slice(0, 8)}...`}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Remove assignment"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                    <AlertCircle size={20} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-xs text-slate-400 font-medium">No match assignments found for this user.</p>
                </div>
            )}
        </div>
    );
}
