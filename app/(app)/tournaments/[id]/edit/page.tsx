"use client";

import { use, useState, useEffect } from "react";
import { updateTournament } from "@/lib/actions/tournament-actions";
import { ChevronLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditTournament({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>(null);

    useEffect(() => {
        fetch(`/api/tournaments/${id}`).then(res => res.json()).then(setFormData);
    }, [id]);

    if (!formData) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="max-w-2xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4">
            <Link href={`/tournaments/${id}`} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8 hover:text-black">
                <ChevronLeft size={14} /> Back to Dashboard
            </Link>

            <h1 className="text-3xl font-instrument mb-8">Edit Tournament</h1>

            <form action={async (data) => {
                setLoading(true);
                const updates = Object.fromEntries(data);
                await updateTournament(id, updates);
            }} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tournament Name</label>
                    <input name="name" defaultValue={formData.name} className="w-full h-14 px-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#FF5A09] outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Location</label>
                        <input name="location" defaultValue={formData.location} className="w-full h-14 px-4 rounded-2xl border border-slate-200 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Start Date</label>
                        <input name="startDate" type="date" defaultValue={formData.startDate} className="w-full h-14 px-4 rounded-2xl border border-slate-200 outline-none" />
                    </div>
                </div>

                <button disabled={loading} className="w-full h-14 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:scale-[1.01] transition-all">
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Changes
                </button>
            </form>
        </div>
    );
}