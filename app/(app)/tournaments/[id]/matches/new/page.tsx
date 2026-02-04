"use client";

import { use, useState } from "react";
import { addMatch } from "@/lib/actions/tournament-actions";
import { ChevronLeft, Swords, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewMatch({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(false);

    return (
        <div className="max-w-2xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4">
            <Link href={`/tournaments/${id}`} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8 hover:text-black">
                <ChevronLeft size={14} /> Cancel
            </Link>

            <div className="mb-10 text-center">
                <div className="w-16 h-16 bg-[#FF5A09]/10 text-[#FF5A09] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Swords size={28} />
                </div>
                <h1 className="text-3xl font-instrument">Create New Match</h1>
                <p className="text-slate-400 text-sm mt-2 font-medium uppercase tracking-widest">Tournament ID: {id}</p>
            </div>

            <form action={async (data) => {
                setLoading(true);
                const matchData = {
                    player1: data.get("p1"),
                    player2: data.get("p2"),
                    court: data.get("court"),
                };
                await addMatch(id, matchData);
            }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Player 1</label>
                        <input name="p1" required placeholder="Name" className="w-full h-16 px-6 rounded-3xl bg-slate-50 border-transparent focus:bg-white focus:border-[#FF5A09] transition-all outline-none text-lg font-medium" />
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mt-3 hidden md:block">
                        <span className="text-xs font-black text-slate-300 italic">VS</span>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right block">Player 2</label>
                        <input name="p2" required placeholder="Name" className="w-full h-16 px-6 rounded-3xl bg-slate-50 border-transparent focus:bg-white focus:border-[#FF5A09] transition-all outline-none text-lg font-medium text-right" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Court Assignment</label>
                    <select name="court" className="w-full h-14 px-4 rounded-2xl border border-slate-200 outline-none">
                        <option>Court 01</option>
                        <option>Court 02</option>
                        <option>Court 03</option>
                    </select>
                </div>

                <button disabled={loading} className="w-full h-16 bg-[#FF5A09] text-white rounded-3xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-[#FF5A09]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="animate-spin" /> : "Schedule Match"}
                </button>
            </form>
        </div>
    );
}