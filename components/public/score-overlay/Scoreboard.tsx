import React from 'react';
import { Activity, Clock } from "lucide-react";
import clsx from 'clsx';
import { MatchState } from "@/types/match";
import { getGameStructure, getPerGameScores } from "@/lib/matchHelpers";
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

    const currentServer = match.currentServer ?? (match.player1?.isServing ? 'player1' : 'player2');
    const p1Serving = currentServer === 'player1';
    const p2Serving = currentServer === 'player2';

    const isLive = match.status === "live" || match.isTimerRunning;
    const gameScores = getPerGameScores(match);

    const formatTime = (seconds: number) => {
        const safeSeconds = isNaN(seconds) ? 0 : Math.max(0, seconds);
        const m = Math.floor(safeSeconds / 60);
        const s = Math.floor(safeSeconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="absolute top-12 left-12 h-[128px] flex items-stretch bg-slate-950/90 text-white rounded-2xl overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.45)] border border-white/10 backdrop-blur-xl animate-in fade-in slide-in-from-left-8 duration-700">
            {match.showTournamentLogo !== false && match.tournamentLogo && (
                <div className={clsx("flex flex-col items-center justify-center px-5 min-w-[100px]", match.status === 'completed' ? 'bg-emerald-600' : isLive ? 'bg-gradient-to-br from-[#FF5A09] to-[#CC4807]' : 'bg-slate-900')}>
                    <div className="relative w-14 h-14 mb-1">
                        <Image
                            src={match.tournamentLogo}
                            alt="Tournament Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    {match.status === 'completed' && <span className="text-[10px] font-black uppercase text-white tracking-widest mt-0.5">FINAL</span>}
                    {match.status === 'break' && <span className="text-[10px] font-black uppercase text-white animate-pulse mt-0.5">BREAK</span>}
                </div>
            )}

            <div className="flex flex-col h-full divide-y divide-white/10">
                {/* Player 1 */}
                <div className="flex-1 flex items-center justify-between min-w-[280px] px-6 gap-4 relative overflow-hidden">
                    <div className="flex items-center gap-3">
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
                    <div className="flex items-center gap-1.5">
                        {gameScores.map((box) => (
                            <div
                                key={box.gameNumber}
                                className={clsx(
                                    "flex items-center justify-center transition-all border",
                                    box.isCurrent
                                        ? "min-w-[46px] h-11 px-2.5 rounded-xl bg-gradient-to-br from-[#FF5A09] to-[#CC4807] text-white border-orange-400/40 shadow-[0_0_12px_rgba(255,90,9,0.4)]"
                                        : box.p1Winner
                                        ? "min-w-[36px] h-9 px-2 rounded-lg bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-sm"
                                        : "min-w-[36px] h-9 px-2 rounded-lg bg-white/5 text-white/35 border-white/5"
                                )}
                            >
                                <span className={clsx(
                                    "tabular-nums",
                                    box.isCurrent ? "text-3xl font-black text-white" : box.p1Winner ? "text-lg font-black text-amber-300" : "text-lg font-bold text-white/40"
                                )}>{box.p1Score}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Player 2 */}
                <div className="flex-1 flex items-center justify-between min-w-[280px] px-6 gap-4 relative overflow-hidden">
                    <div className="flex items-center gap-3">
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
                    <div className="flex items-center gap-1.5">
                        {gameScores.map((box) => (
                            <div
                                key={box.gameNumber}
                                className={clsx(
                                    "flex items-center justify-center transition-all border",
                                    box.isCurrent
                                        ? "min-w-[46px] h-11 px-2.5 rounded-xl bg-gradient-to-br from-[#FF5A09] to-[#CC4807] text-white border-orange-400/40 shadow-[0_0_12px_rgba(255,90,9,0.4)]"
                                        : box.p2Winner
                                        ? "min-w-[36px] h-9 px-2 rounded-lg bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-sm"
                                        : "min-w-[36px] h-9 px-2 rounded-lg bg-white/5 text-white/35 border-white/5"
                                )}
                            >
                                <span className={clsx(
                                    "tabular-nums",
                                    box.isCurrent ? "text-3xl font-black text-white" : box.p2Winner ? "text-lg font-black text-amber-300" : "text-lg font-bold text-white/40"
                                )}>{box.p2Score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timer Section */}
            <div className="flex flex-col items-center justify-center px-7 bg-white/5 border-l border-white/10 min-w-[110px]">
                <Clock size={16} className="text-white/40 mb-1" />
                <span className="text-2xl font-mono font-black tracking-tight text-white/90">{formatTime(elapsedDisplay)}</span>
                {match.status === 'completed' && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mt-1">FINAL</span>}
            </div>
        </div>
    );
}

