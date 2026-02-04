"use client";

import React, { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { collectionGroup, query, where, onSnapshot } from "firebase/firestore";

export default function ScoreOverlay({ matchId }: { matchId: string }) {
    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // collectionGroup allows finding the matchId across any tournament path
        const q = query(collectionGroup(db, "matches"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const matchDoc = snapshot.docs.find(d => d.id === matchId);
            if (matchDoc) {
                setMatch(matchDoc.data());
                setError(null);
            } else {
                setError("Match not found");
            }
            setLoading(false);
        }, (err) => {
            console.error("Firestore Error:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [matchId]);

    if (loading || error || !match) return null; // Keep OBS clean on error/loading

    const isLive = match.status === "live" || match.status === "in_progress";

    return (
        <div className="fixed inset-0 p-8 pointer-events-none font-instrument">
            {/* TOP LEFT: Scoreboard (Badminton Style) */}
            <div className="absolute top-8 left-8 flex items-stretch bg-black/90 text-white rounded-xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-md animate-in fade-in slide-in-from-left-4">
                <div className={`flex flex-col items-center justify-center px-3 ${isLive ? 'bg-[#FF5A09]' : 'bg-slate-800'}`}>
                    {isLive ? <Activity size={16} className="text-white" /> : <span className="text-[8px] font-bold uppercase">{match.status}</span>}
                </div>

                <div className="flex flex-col divide-y divide-white/10">
                    <div className="flex items-center justify-between min-w-[240px] px-4 py-2 gap-4">
                        <span className="text-sm font-bold uppercase tracking-tight">{match.team1}</span>
                        <span className="text-2xl font-black tabular-nums text-[#FF5A09]">{match.score1 || 0}</span>
                    </div>
                    <div className="flex items-center justify-between min-w-[240px] px-4 py-2 gap-4">
                        <span className="text-sm font-bold uppercase tracking-tight">{match.team2}</span>
                        <span className="text-2xl font-black tabular-nums text-[#FF5A09]">{match.score2 || 0}</span>
                    </div>
                </div>
            </div>

            {/* TOP RIGHT: Streamer Logo */}
            <div className="absolute top-8 right-8">
                {match.streamerLogo && (
                    <img src={match.streamerLogo} alt="Streamer Logo" className="h-16 w-auto object-contain drop-shadow-md" />
                )}
            </div>

            {/* BOTTOM RIGHT: Extra Info Popup */}
            {match.lastRally && (
                <div className="absolute bottom-12 right-12 animate-in slide-in-from-right-8 duration-500">
                    <div className="bg-white text-black px-4 py-2 rounded-lg shadow-2xl flex items-center gap-3 border-b-4 border-[#FF5A09]">
                        <div className="w-2 h-2 bg-[#FF5A09] rounded-full animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-wider">Rally: {match.lastRally} Shots</span>
                    </div>
                </div>
            )}
        </div>
    );
}