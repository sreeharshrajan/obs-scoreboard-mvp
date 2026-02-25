import React from 'react';
import { Activity, Clock } from "lucide-react";
import clsx from 'clsx';
import { MatchState } from "@/types/match";
import Image from "next/image";

interface ScoreboardProps {
    match: MatchState;
    elapsedDisplay: number;
}

export default function Scoreboard({ match, elapsedDisplay }: ScoreboardProps) {
    // Handle Badminton Schema
    const p1Name = match.player1?.name2
        ? `${match.player1.name} / ${match.player1.name2}`
        : match.player1?.name || "Player 1";
    const p2Name = match.player2?.name2
        ? `${match.player2.name} / ${match.player2.name2}`
        : match.player2?.name || "Player 2";
    const p1Score = match.player1?.score || 0;
    const p2Score = match.player2?.score || 0;
    const p1Serving = match.player1?.isServing ?? false;
    const p2Serving = match.player2?.isServing ?? false;

    const isLive = match.status === "live" || match.isTimerRunning;

    const formatTime = (seconds: number) => {
        const safeSeconds = isNaN(seconds) ? 0 : Math.max(0, seconds);
        const m = Math.floor(safeSeconds / 60);
        const s = Math.floor(safeSeconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="absolute top-12 left-12 flex items-stretch bg-black/90 text-white rounded-2xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border border-white/10 backdrop-blur-xl animate-in fade-in slide-in-from-left-8 duration-700">
            <div className={clsx("flex flex-col items-center justify-center px-4 min-w-[100px]", isLive ? 'bg-gradient-to-br from-[#FF5A09] to-[#CC4807]' : 'bg-slate-900')}>
                {match.showTournamentLogo !== false && match.tournamentLogo ? (
                    <div className="relative w-16 h-16 mb-2">
                        <Image
                            src={match.tournamentLogo}
                            alt="Tournament Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                ) : (
                    isLive ? <Activity size={32} className="text-white" /> : <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{match.status || 'OFF'}</span>
                )}
                {(match.status === 'break') && <span className="text-[10px] font-black uppercase text-white animate-pulse mt-1">BREAK</span>}
            </div>

            <div className="flex flex-col divide-y divide-white/10">
                {/* Player 1 */}
                <div className="flex items-center justify-between min-w-[400px] px-8 py-5 gap-8 relative overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className={clsx(
                            "w-3 h-3 rounded-full transition-all duration-500",
                            p1Serving ? "bg-[#FF5A09] shadow-[0_0_12px_#FF5A09] scale-110" : "bg-white/5 scale-75"
                        )} />
                        <div className="flex flex-col">
                            <span className={clsx(
                                "text-xl font-black uppercase tracking-tight transition-colors duration-300",
                                p1Serving ? "text-white" : "text-white/60"
                            )}>
                                {p1Name}
                            </span>
                        </div>
                    </div>
                    <span className="text-5xl font-black tabular-nums text-[#FF5A09] drop-shadow-[0_0_8px_rgba(255,90,9,0.3)]">
                        {p1Score}
                    </span>
                </div>

                {/* Player 2 */}
                <div className="flex items-center justify-between min-w-[400px] px-8 py-5 gap-8 relative overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className={clsx(
                            "w-3 h-3 rounded-full transition-all duration-500",
                            p2Serving ? "bg-[#FF5A09] shadow-[0_0_12px_#FF5A09] scale-110" : "bg-white/5 scale-75"
                        )} />
                        <div className="flex flex-col">
                            <span className={clsx(
                                "text-xl font-black uppercase tracking-tight transition-colors duration-300",
                                p2Serving ? "text-white" : "text-white/60"
                            )}>
                                {p2Name}
                            </span>
                        </div>
                    </div>
                    <span className="text-5xl font-black tabular-nums text-[#FF5A09] drop-shadow-[0_0_8px_rgba(255,90,9,0.3)]">
                        {p2Score}
                    </span>
                </div>
            </div>

            {/* Timer Section */}
            <div className="flex flex-col items-center justify-center px-8 bg-white/5 border-l border-white/10 min-w-[120px]">
                <Clock size={16} className="text-white/40 mb-2" />
                <span className="text-3xl font-mono font-black tracking-tight text-white/90">{formatTime(elapsedDisplay)}</span>
            </div>
        </div>
    );
}

