"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Shield, Lock, Mail, User, Check, Layers } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import type { PermissionProfileName, UserRole } from "@/lib/types/permissions";

interface TournamentOption {
    id: string;
    name: string;
}

interface MatchOption {
    id: string;
    name?: string;
    court?: string;
    player1?: { name: string };
    player2?: { name: string };
}

interface CreateUserModalProps {
    onClose: () => void;
    onUserCreated: () => void;
}

export function CreateUserModal({ onClose, onUserCreated }: CreateUserModalProps) {
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("staff");
    const [permissionProfile, setPermissionProfile] = useState<PermissionProfileName>("scorer");

    // Assignment fields
    const [assignTournament, setAssignTournament] = useState(false);
    const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState("");
    const [matches, setMatches] = useState<MatchOption[]>([]);
    const [selectedMatchId, setSelectedMatchId] = useState<string>("all"); // "all" or matchId

    const [loadingTournaments, setLoadingTournaments] = useState(false);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch tournaments list when assignTournament is enabled
    useEffect(() => {
        if (!assignTournament) return;
        const fetchTournaments = async () => {
            setLoadingTournaments(true);
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
                    if (data.length > 0) {
                        setSelectedTournamentId(data[0].id);
                    }
                }
            } catch (err) {
                console.error("Fetch tournaments error:", err);
            } finally {
                setLoadingTournaments(false);
            }
        };
        fetchTournaments();
    }, [assignTournament]);

    // Fetch matches list when selectedTournamentId changes
    useEffect(() => {
        setSelectedMatchId("all");
        if (!assignTournament || !selectedTournamentId) return;
        const fetchMatches = async () => {
            setLoadingMatches(true);
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
            } finally {
                setLoadingMatches(false);
            }
        };
        fetchMatches();
    }, [assignTournament, selectedTournamentId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");
            const token = await user.getIdToken();

            // 1. Create User
            const createRes = await fetch("/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    displayName,
                    email,
                    password,
                    role,
                }),
            });

            if (!createRes.ok) {
                const errData = await createRes.json();
                throw new Error(errData.error || "Failed to create user");
            }

            const createdData = await createRes.json();
            const newUserId = createdData.user.id;

            // 2. Create Assignment if configured
            if (role === "staff" && assignTournament && selectedTournamentId) {
                const matchId = selectedMatchId === "all" ? null : selectedMatchId;
                const assignRes = await fetch("/api/match-assignments", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        userId: newUserId,
                        tournamentId: selectedTournamentId,
                        matchId,
                        permissionProfile,
                    }),
                });

                if (!assignRes.ok) {
                    console.warn("User created, but assignment failed.");
                }
            }

            onUserCreated();
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to create user";
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div className="relative w-full max-w-xl bg-white dark:bg-[#1A1A1A] rounded-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#FF5A09]/10 flex items-center justify-center text-[#FF5A09]">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-instrument font-medium tracking-tight">Create User Account</h2>
                            <p className="text-slate-400 text-xs">Add a new staff, organizer, or viewer account</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                    {error && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                            {error}
                        </div>
                    )}

                    {/* Account Details */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Account Details</h3>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Full Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm outline-none focus:border-[#FF5A09]/50 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    placeholder="scorer@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm outline-none focus:border-[#FF5A09]/50 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Temporary Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="Minimum 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm outline-none focus:border-[#FF5A09]/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Account Role</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole("staff")}
                                className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-24 transition-all ${role === "staff"
                                        ? "bg-[#FF5A09]/10 border-[#FF5A09] text-[#FF5A09]"
                                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"
                                    }`}
                            >
                                <Shield size={18} />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider">Staff</p>
                                    <p className="text-[9px] opacity-75 truncate">Scorer, Referee, Operator</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole("organizer")}
                                className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-24 transition-all ${role === "organizer"
                                        ? "bg-[#FF5A09]/10 border-[#FF5A09] text-[#FF5A09]"
                                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"
                                    }`}
                            >
                                <Shield size={18} />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider">Organizer</p>
                                    <p className="text-[9px] opacity-75 truncate">Full Tournament Admin</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole("viewer")}
                                className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-24 transition-all ${role === "viewer"
                                        ? "bg-[#FF5A09]/10 border-[#FF5A09] text-[#FF5A09]"
                                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"
                                    }`}
                            >
                                <Shield size={18} />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider">Viewer</p>
                                    <p className="text-[9px] opacity-75 truncate">Read-Only Access</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Staff Profile & Assignment Options */}
                    {role === "staff" && (
                        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5 animate-in fade-in duration-300">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Staff Permission Profile</h3>

                            <div className="grid grid-cols-3 gap-2">
                                {(["scorer", "referee", "broadcaster"] as PermissionProfileName[]).map((prof) => (
                                    <button
                                        key={prof}
                                        type="button"
                                        onClick={() => setPermissionProfile(prof)}
                                        className={`py-3 px-3 rounded-xl border text-center text-xs font-bold uppercase tracking-widest capitalize transition-all ${permissionProfile === prof
                                                ? "bg-[#FF5A09] text-white border-[#FF5A09]"
                                                : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"
                                            }`}
                                    >
                                        {prof}
                                    </button>
                                ))}
                            </div>

                            {/* Initial Assignment Toggle */}
                            <div className="pt-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={assignTournament}
                                        onChange={(e) => setAssignTournament(e.target.checked)}
                                        className="w-4 h-4 rounded text-[#FF5A09] focus:ring-[#FF5A09]"
                                    />
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Assign Tournament / Match Now</span>
                                </label>
                            </div>

                            {assignTournament && (
                                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 animate-in fade-in duration-300">
                                    {loadingTournaments ? (
                                        <p className="text-xs text-slate-400 animate-pulse">Loading tournaments...</p>
                                    ) : tournaments.length === 0 ? (
                                        <p className="text-xs text-slate-400">No tournaments available.</p>
                                    ) : (
                                        <>
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
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 h-12 rounded-2xl bg-[#FF5A09] text-white text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? "Creating..." : "Create Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
