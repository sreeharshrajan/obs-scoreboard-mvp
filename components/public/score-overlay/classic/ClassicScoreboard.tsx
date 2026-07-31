import React from 'react';
import { Activity, Clock } from "lucide-react";
import clsx from 'clsx';
import { MatchState } from "@/types/match";
import { getGameStructure } from "@/lib/matchHelpers";
import Image from "next/image";

interface ClassicScoreboardProps {
    match: MatchState;
    elapsedDisplay: number;
}

export default function ClassicScoreboard({ match, elapsedDisplay }: ClassicScoreboardProps) {
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

    const { p1GamesWon, p2GamesWon, totalGames, currentGame } = getGameStructure(match);
    const gamesNeeded = Math.ceil(totalGames / 2);

    const formatTime = (seconds: number) => {
        const safeSeconds = isNaN(seconds) ? 0 : Math.max(0, seconds);
        const m = Math.floor(safeSeconds / 60);
        const s = Math.floor(safeSeconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatScore = (score: number) => {
        return score < 10 ? `0${score}` : `${score}`;
    };

    return (
        <div className="absolute top-12 left-12 flex items-stretch shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-left-8 duration-700">
            {/* Left Brand Badge */}
            {match.showTournamentLogo !== false && match.tournamentLogo && (
                <div className="flex flex-col items-center justify-center px-5 bg-gradient-to-br from-red-600 to-red-700 border-y border-l border-red-500/30 min-w-[90px] rounded-l-2xl">
                    <div className="relative w-14 h-14">
                        <Image
                            src={match.tournamentLogo}
                            alt="Tournament Logo"
                            fill
                            className="object-contain filter drop-shadow-md"
                        />
                    </div>
                    {match.status === 'break' && <span className="text-[10px] font-black uppercase text-white animate-pulse mt-0.5">BREAK</span>}
                </div>
            )}

            {/* Middle Player Rows (Dark Carbon Bars) */}
            <div className="flex flex-col divide-y divide-white/10 bg-[#1E293B] border-y border-white/10">
                {/* Player 1 Row */}
                <div className="flex-1 flex items-center justify-between min-w-[360px] px-6 gap-6 relative">
                    <div className="flex items-center gap-3.5">
                        <div className={clsx(
                            "w-3.5 h-3.5 rounded-full transition-all duration-300",
                            p1Serving ? "bg-red-500 shadow-[0_0_12px_#EF4444] scale-110" : "bg-white/10 scale-75"
                        )} />
                        <span className={clsx(
                            "text-xl font-black uppercase tracking-tight transition-colors",
                            p1Serving ? "text-white" : "text-slate-300"
                        )}>
                            {p1Name}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Games Won Dots */}
                        {totalGames > 1 && (
                            <div className="flex items-center gap-1">
                                {Array.from({ length: gamesNeeded }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={clsx(
                                            "w-1.5 h-1.5 rounded-full",
                                            i < p1GamesWon ? "bg-red-500" : "bg-white/20"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                        {/* Score Pill */}
                        <div className="bg-white text-slate-900 px-3.5 py-1 rounded-xl shadow-md flex items-center justify-center min-w-[48px]">
                            <span className="text-2xl font-black tabular-nums">{formatScore(p1Score)}</span>
                        </div>
                    </div>
                </div>

                {/* Player 2 Row */}
                <div className="flex-1 flex items-center justify-between min-w-[360px] px-6 gap-6 relative">
                    <div className="flex items-center gap-3.5">
                        <div className={clsx(
                            "w-3.5 h-3.5 rounded-full transition-all duration-300",
                            p2Serving ? "bg-red-500 shadow-[0_0_12px_#EF4444] scale-110" : "bg-white/10 scale-75"
                        )} />
                        <span className={clsx(
                            "text-xl font-black uppercase tracking-tight transition-colors",
                            p2Serving ? "text-white" : "text-slate-300"
                        )}>
                            {p2Name}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Games Won Dots */}
                        {totalGames > 1 && (
                            <div className="flex items-center gap-1">
                                {Array.from({ length: gamesNeeded }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={clsx(
                                            "w-1.5 h-1.5 rounded-full",
                                            i < p2GamesWon ? "bg-red-500" : "bg-white/20"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                        {/* Score Pill */}
                        <div className="bg-white text-slate-900 px-3.5 py-1 rounded-xl shadow-md flex items-center justify-center min-w-[48px]">
                            <span className="text-2xl font-black tabular-nums">{formatScore(p2Score)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timer Box (Red Accent End Cap) */}
            <div className="flex flex-col items-center justify-center px-6 bg-gradient-to-b from-red-600 to-red-700 text-white rounded-r-2xl border-y border-r border-red-500/30 min-w-[100px]">
                <Clock size={16} className="text-red-200 mb-1" />
                <span className="text-xl font-mono font-black tracking-tight text-white">{formatTime(elapsedDisplay)}</span>
                {totalGames > 1 && (
                    <span className="text-[9px] font-black uppercase text-red-200/70 mt-1 tracking-widest">G{currentGame > totalGames ? totalGames : currentGame}</span>
                )}
            </div>
        </div>
    );
}
