import React from 'react';
import { MatchState } from "@/types/match";
import Image from "next/image";
import { Activity } from 'lucide-react';
import { getMatchDetails, Sponsor } from '@/lib/matchHelpers';
import clsx from 'clsx';

interface ClassicFullScreenMatchInfoProps {
    match: MatchState;
    sponsors: Sponsor[];
    currentSponsorIndex: number;
    elapsedDisplay?: number;
}

export default function ClassicFullScreenMatchInfo({ match, sponsors, currentSponsorIndex, elapsedDisplay }: ClassicFullScreenMatchInfoProps) {
    if (!match.showFullScreenMatchDetails) return null;

    const {
        p1Name,
        p1Name2,
        p2Name,
        p2Name2,
        p1Score,
        p2Score,
        p1Serving,
        p2Serving,
        tournamentName,
        matchCategory,
        courtName,
        activeSponsor,
        gameHistory,
        gameScores,
    } = getMatchDetails(match, sponsors, currentSponsorIndex);

    const formatScore = (score: number | string) => {
        if (typeof score === 'number') {
            return score < 10 ? `0${score}` : `${score}`;
        }
        return score;
    };

    return (
        <div className="absolute inset-x-0 bottom-16 flex justify-center z-30 pointer-events-none font-sans px-12 animate-in slide-in-from-bottom-12 fade-in duration-700">
            <div className="w-full max-w-5xl flex flex-col bg-[#1E293B] text-white rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                {/* Red Header Bar (Matches Classic Red Badge & Timer) */}
                <div className="flex items-center justify-between px-8 py-5 bg-linear-to-r from-red-600 via-red-700 to-red-600 border-b border-red-500/40 text-white">
                    <div className="flex items-center gap-4">
                        {match.showTournamentLogo !== false && match.tournamentLogo && (
                            <div className="relative w-12 h-12">
                                <Image
                                    src={match.tournamentLogo}
                                    alt="Logo"
                                    fill
                                    className="object-contain filter drop-shadow-md"
                                />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-tight">{tournamentName}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="px-3.5 py-1.5 rounded-xl bg-black/20 text-xs font-black uppercase tracking-wider text-white border border-white/10">
                            {courtName}
                        </span>
                        <span className="px-3.5 py-1.5 rounded-xl bg-white text-red-700 text-xs font-black uppercase tracking-wider shadow-md">
                            {matchCategory}
                        </span>
                    </div>
                </div>

                {/* Score Grid (Dark Carbon Bar with White Score Pills) */}
                <div className="flex items-stretch h-36 bg-[#1E293B] divide-x divide-white/10 border-b border-white/10">
                    {/* Player 1 Side */}
                    <div className="flex-1 flex items-center justify-between px-10">
                        <div className="flex items-center gap-4 pr-4">
                            <div className={clsx(
                                "w-4 h-4 rounded-full transition-all duration-300 flex-shrink-0",
                                p1Serving ? "bg-red-500 shadow-[0_0_12px_#EF4444] scale-110" : "bg-white/10 scale-75"
                            )} />
                            <div className="flex flex-col items-start justify-center">
                                <span className={clsx(
                                    "text-3xl font-black uppercase tracking-tight line-clamp-1 transition-colors",
                                    p1Serving ? "text-white" : "text-slate-300"
                                )}>
                                    {p1Name}
                                </span>
                                {p1Name2 && (
                                    <span className="text-2xl font-bold text-slate-400 uppercase tracking-tight line-clamp-1 mt-0.5">
                                        {p1Name2}
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Classic Per-Game Score Pills */}
                        <div className="flex items-center gap-1.5">
                            {gameScores.map((box) => (
                                <div
                                    key={box.gameNumber}
                                    className={clsx(
                                        "shadow-xl border flex flex-col items-center justify-center transition-all",
                                        box.isCurrent
                                            ? "px-4 py-2 rounded-2xl min-w-[60px] bg-red-600 text-white border-red-400 font-black"
                                            : box.p1Winner
                                            ? "px-3 py-1 rounded-xl min-w-[48px] bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md"
                                            : "px-3 py-1 rounded-xl min-w-[48px] bg-white/10 text-white/35 border-white/5 opacity-60"
                                    )}
                                >
                                    <span className="text-[8px] font-black uppercase text-white/60 tracking-wider">Set {box.gameNumber}</span>
                                    <span className={clsx(
                                        "tabular-nums",
                                        box.isCurrent ? "text-3xl font-black text-white" : box.p1Winner ? "text-xl font-black text-slate-950" : "text-xl font-medium text-white/40"
                                    )}>{formatScore(box.p1Score)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Red VS Divider */}
                    <div className="w-20 flex items-center justify-center bg-linear-to-b from-red-600 to-red-700 shadow-inner">
                        <span className="text-2xl font-black italic text-white tracking-widest drop-shadow-md">VS</span>
                    </div>

                    {/* Player 2 Side */}
                    <div className="flex-1 flex items-center justify-between px-10">
                        {/* Classic Per-Game Score Pills */}
                        <div className="flex items-center gap-1.5">
                            {gameScores.map((box) => (
                                <div
                                    key={box.gameNumber}
                                    className={clsx(
                                        "shadow-xl border flex flex-col items-center justify-center transition-all",
                                        box.isCurrent
                                            ? "px-4 py-2 rounded-2xl min-w-[60px] bg-red-600 text-white border-red-400 font-black"
                                            : box.p2Winner
                                            ? "px-3 py-1 rounded-xl min-w-[48px] bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md"
                                            : "px-3 py-1 rounded-xl min-w-[48px] bg-white/10 text-white/35 border-white/5 opacity-60"
                                    )}
                                >
                                    <span className="text-[8px] font-black uppercase text-white/60 tracking-wider">Set {box.gameNumber}</span>
                                    <span className={clsx(
                                        "tabular-nums",
                                        box.isCurrent ? "text-3xl font-black text-white" : box.p2Winner ? "text-xl font-black text-slate-950" : "text-xl font-medium text-white/40"
                                    )}>{formatScore(box.p2Score)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 pl-4 text-right">
                            <div className="flex flex-col items-end justify-center">
                                <span className={clsx(
                                    "text-3xl font-black uppercase tracking-tight line-clamp-1 transition-colors",
                                    p2Serving ? "text-white" : "text-slate-300"
                                )}>
                                    {p2Name}
                                </span>
                                {p2Name2 && (
                                    <span className="text-2xl font-bold text-slate-400 uppercase tracking-tight line-clamp-1 mt-0.5">
                                        {p2Name2}
                                    </span>
                                )}
                            </div>
                            <div className={clsx(
                                "w-4 h-4 rounded-full transition-all duration-300 flex-shrink-0",
                                p2Serving ? "bg-red-500 shadow-[0_0_12px_#EF4444] scale-110" : "bg-white/10 scale-75"
                            )} />
                        </div>
                    </div>
                </div>

                {/* Set History Row */}
                {gameHistory.length > 0 && (
                    <div className="flex items-center justify-center gap-4 py-3 px-8 bg-slate-900/80 border-t border-white/10">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-2">Sets</span>
                        {gameHistory.map((g) => (
                            <span
                                key={g.gameNumber}
                                className="px-2.5 py-1 rounded-lg bg-white/5 text-[10px] font-bold text-slate-300 tabular-nums border border-white/5"
                            >
                                G{g.gameNumber} {g.player1Score}–{g.player2Score}
                            </span>
                        ))}
                    </div>
                )}

                {/* Classic Sponsor Footer */}
                {activeSponsor && (
                    <div className="py-3 px-8 bg-slate-950 flex items-center justify-center gap-4 border-t border-white/10">
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]"> Sponsored By</span>
                        <div className="h-7 relative w-28">
                            <Image src={activeSponsor.advertUrl} alt={activeSponsor.name} fill className="object-contain" />
                        </div>
                        <span className="text-sm font-black text-white">{activeSponsor.name}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
