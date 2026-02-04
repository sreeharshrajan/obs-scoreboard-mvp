"use client";

import { use, useState, useEffect } from "react";
import { updateTournament } from "@/lib/actions/tournament-actions";
import { ChevronLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

// 1. Define an interface to replace 'any'
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
    // 2. Apply the interface here
    const [formData, setFormData] = useState<TournamentData | null>(null);

    useEffect(() => {
        fetch(`/api/tournaments/${id}`)
            .then((res) => res.json())
            .then((data) => setFormData(data));
    }, [id]);

    if (!formData) {
        return (
            <div className="p-10 text-center">
                <Loader2 className="animate-spin mx-auto" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4">
            <Link
                href={`/tournaments/${id}`}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8 hover:text-black"
            >
                <ChevronLeft size={14} /> Back to Dashboard
            </Link>

            <h1 className="text-3xl font-instrument mb-8">Edit Tournament</h1>

            <form
                action={async (data) => {
                    setLoading(true);
                    const updates = Object.fromEntries(data);
                    await updateTournament(id, updates);
                    setLoading(false); // Reset loading state
                }}
                className="space-y-6"
            >
                {/* 3. Link labels using htmlFor and id */}
                <div className="space-y-2">
                    <label
                        htmlFor="tournament-name"
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                        Tournament Name
                    </label>
                    <input
                        id="tournament-name"
                        name="name"
                        defaultValue={formData.name}
                        placeholder="Enter tournament name"
                        className="w-full h-14 px-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#FF5A09] outline-none transition-all"
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
                            className="w-full h-14 px-4 rounded-2xl border border-slate-200 outline-none"
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
                            defaultValue={formData.startDate}
                            className="w-full h-14 px-4 rounded-2xl border border-slate-200 outline-none"
                        />
                    </div>
                </div>

                <button
                    disabled={loading}
                    className="w-full h-14 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Save Changes
                </button>
            </form>
        </div>
    );
}