"use client";

import { use, useState, useEffect } from "react";
import { updateTournament } from "@/lib/actions/tournament-actions";
import { ChevronLeft, Save, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { User } from "firebase/auth";
import DashboardLoader from "@/components/dashboard/loader";
import ErrorFallback from "@/components/dashboard/error-fallback";

interface TournamentData {
    name: string;
    location: string;
    startDate: string;
    category?: string;
    scoringType?: string;
    status?: string;
}

export default function EditTournament({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<TournamentData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = auth.currentUser;
                let token = "";

                if (user) {
                    token = await user.getIdToken();
                } else {
                    // Start listener if not immediately available
                    await new Promise<void>((resolve) => {
                        const unsub = auth.onAuthStateChanged(async (u) => {
                            if (u) {
                                token = await u.getIdToken();
                            }
                            unsub();
                            resolve();
                        });
                    });
                }

                if (!token) {
                    // Try getting via listener one last time if logic above missed
                    const u = auth.currentUser;
                    if (u) token = await u.getIdToken();
                }

                if (!token) throw new Error("Not authenticated");

                const res = await fetch(`/api/tournaments/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error("Failed to fetch tournament data");
                const data = await res.json();
                setFormData(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load tournament data");
            }
        };
        fetchData();
    }, [id]);

    if (error) {
        return <ErrorFallback error={error} backUrl={`/tournaments/${id}`} backLabel="Return to Dashboard" />;
    }

    if (!formData) {
        return <DashboardLoader message="Loading Details..." />;
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4">


            <form
                action={async (data) => {
                    setLoading(true);
                    const updates = Object.fromEntries(data);
                    await updateTournament(id, updates);
                    // No need to setLoading(false) as redirect happens
                }}
                className="space-y-6"
            >
                <div className="space-y-2">
                    <label
                        htmlFor="name"
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                        Tournament Name
                    </label>
                    <input
                        id="name"
                        name="name"
                        defaultValue={formData.name}
                        placeholder="Enter tournament name"
                        className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-2 focus:ring-[#FF5A09] outline-none transition-all"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label
                            htmlFor="location"
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                        >
                            Location
                        </label>
                        <input
                            id="location"
                            name="location"
                            defaultValue={formData.location}
                            placeholder="City or Venue"
                            className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:border-[#FF5A09] transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="startDate"
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                        >
                            Start Date
                        </label>
                        <input
                            id="startDate"
                            name="startDate"
                            type="date"
                            defaultValue={formData.startDate.split('T')[0]}
                            className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:border-[#FF5A09] transition-colors"
                        />
                    </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label
                            htmlFor="category"
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                        >
                            Category
                        </label>
                        <input
                            id="category"
                            name="category"
                            defaultValue={formData.category}
                            placeholder="e.g. Men's Singles"
                            className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:border-[#FF5A09] transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label
                            htmlFor="scoringType"
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                        >
                            Scoring
                        </label>
                        <input
                            id="scoringType"
                            name="scoringType"
                            defaultValue={formData.scoringType}
                            placeholder="e.g. 21 Points"
                            className="w-full h-14 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:border-[#FF5A09] transition-colors"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        disabled={loading}
                        className="w-full h-14 bg-[#FF5A09] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#FF5A09]/20 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}