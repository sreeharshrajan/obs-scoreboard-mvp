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
        <div className="absolute top-8 left-8 flex items-stretch bg-black/90 text-white rounded-xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-md animate-in fade-in slide-in-from-left-4">
            <div className={clsx("flex flex-col items-center justify-center px-2 min-w-[80px]", isLive ? 'bg-[#FF5A09]' : 'bg-slate-900')}>
                {match.showStreamerLogo !== false && match.streamerLogo ? (
                    <Image
                        src={match.streamerLogo}
                        alt="Streamer Logo"
                        width={0}
                        height={0}
                        sizes="100vw"
                        className="w-12 h-12 object-contain mb-1"
                    />
                ) : match.showTournamentLogo !== false && match.tournamentLogo ? (
                    <Image
                        src={match.tournamentLogo}
                        alt="Tournament Logo"
                        width={0}
                        height={0}
                        sizes="100vw"
                        className="w-12 h-12 object-contain mb-1"
                    />
                ) : (
                    isLive ? <Activity size={24} className="text-white" /> : <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{match.status || 'OFF'}</span>
                )}
                {(match.status === 'break') && <span className="text-[8px] font-bold uppercase text-white animate-pulse mt-1">BREAK</span>}
            </div>

            <div className="flex flex-col divide-y divide-white/10">
                {/* Player 1 */}
                <div className="flex items-center justify-between min-w-[300px] px-4 py-2 gap-4 relative overflow-hidden">
                    <div className="flex items-center gap-2">
                        {p1Serving && <div className="w-2 h-2 bg-[#FF5A09] rounded-full animate-pulse shadow-[0_0_8px_#FF5A09]" />}
                        <div className="flex flex-col">
                            <span className={clsx("text-sm font-black uppercase tracking-tight", p1Serving ? "text-white" : "text-white/70")}>{p1Name}</span>
                        </div>
                    </div>
                    <span className="text-3xl font-black tabular-nums text-[#FF5A09]">{p1Score}</span>
                </div>

                {/* Player 2 */}
                <div className="flex items-center justify-between min-w-[300px] px-4 py-2 gap-4 relative overflow-hidden">
                    <div className="flex items-center gap-2">
                        {p2Serving && <div className="w-2 h-2 bg-[#FF5A09] rounded-full animate-pulse shadow-[0_0_8px_#FF5A09]" />}
                        <div className="flex flex-col">
                            <span className={clsx("text-sm font-black uppercase tracking-tight", p2Serving ? "text-white" : "text-white/70")}>{p2Name}</span>
                        </div>
                    </div>
                    <span className="text-3xl font-black tabular-nums text-[#FF5A09]">{p2Score}</span>
                </div>
            </div>

            {/* Timer Section */}
            <div className="flex flex-col items-center justify-center px-4 bg-white/5 border-l border-white/10 min-w-[90px]">
                <Clock size={12} className="text-white/40 mb-1" />
                <span className="text-xl font-mono font-bold tracking-tight">{formatTime(elapsedDisplay)}</span>
            </div>
        </div>
    );
}
