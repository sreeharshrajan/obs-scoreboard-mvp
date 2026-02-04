"use client";

import React from "react";
import { Activity } from "lucide-react";

interface ScoreOverlayProps {
    team1: string;
    team2: string;
    score1: number;
    score2: number;
    status: string;
    court?: string;
    logoUrl?: string; // Prop for streamer logo
    extraInfo?: string; // Prop for the bottom-right popup
}

export default function ScoreOverlay({
    team1, team2, score1, score2, status, court, logoUrl, extraInfo
}: ScoreOverlayProps) {
    const isLive = status === "live" || status === "in_progress";

    return (
        <div className="fixed inset-0 p-8 pointer-events-none font-instrument">
            {/* TOP LEFT: Main Scoreboard */}
            <div className="absolute top-8 left-8 flex items-stretch bg-black/90 text-white rounded-xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-md">
                <div className={`flex flex-col items-center justify-center px-3 ${isLive ? 'bg-[#FF5A09]' : 'bg-slate-800'}`}>
                    {isLive ? <Activity size={16} className="text-white" /> : <span className="text-[8px] font-bold uppercase">{status}</span>}
                </div>

                <div className="flex flex-col divide-y divide-white/10">
                    {/* Team 1 Row */}
                    <div className="flex items-center justify-between min-w-[240px] px-4 py-2 gap-4">
                        <span className="text-sm font-bold uppercase tracking-tight">{team1}</span>
                        <span className="text-2xl font-black tabular-nums text-[#FF5A09]">{score1}</span>
                    </div>
                    {/* Team 2 Row */}
                    <div className="flex items-center justify-between min-w-[240px] px-4 py-2 gap-4">
                        <span className="text-sm font-bold uppercase tracking-tight">{team2}</span>
                        <span className="text-2xl font-black tabular-nums text-[#FF5A09]">{score2}</span>
                    </div>
                </div>
            </div>

            {/* TOP RIGHT: Streamer Logo Area */}
            <div className="absolute top-8 right-8">
                {logoUrl ? (
                    <img src={logoUrl} alt="Streamer Logo" className="h-16 w-auto object-contain drop-shadow-md" />
                ) : (
                    <div className="h-16 w-32 bg-white/5 border border-dashed border-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Logo Space</span>
                    </div>
                )}
            </div>

            {/* BOTTOM RIGHT: Info Popup (Like "Longest Rally") */}
            {extraInfo && (
                <div className="absolute bottom-12 right-12 animate-in slide-in-from-right-8 duration-500">
                    <div className="bg-white text-black px-4 py-2 rounded-lg shadow-2xl flex items-center gap-3 border-b-4 border-[#FF5A09]">
                        <div className="w-2 h-2 bg-[#FF5A09] rounded-full animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-wider">{extraInfo}</span>
                    </div>
                </div>
            )}
        </div>
    );
}