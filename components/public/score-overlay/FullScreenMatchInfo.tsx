import React from 'react';
import { MatchState } from "@/types/match";
import Image from "next/image";
import { Trophy } from 'lucide-react';
import { getMatchDetails, Sponsor } from '@/lib/matchHelpers';
import clsx from 'clsx';

interface FullScreenMatchInfoProps {
    match: MatchState;
    sponsors: Sponsor[];
    currentSponsorIndex: number;
}

export default function FullScreenMatchInfo({ match, sponsors, currentSponsorIndex }: FullScreenMatchInfoProps) {
    if (!match.showFullScreenMatchDetails) return null;

    const {
        p1Name,
        p1Name2,
        p2Name,
        p2Name2,
        tournamentName,
        matchCategory,
        courtName,
        matchType,
        activeSponsor,
        gameScores,
    } = getMatchDetails(match, sponsors, currentSponsorIndex);

    return (
        <div className="absolute inset-x-0 bottom-16 flex justify-center z-30 pointer-events-none font-sans px-12 animate-in slide-in-from-bottom-12 fade-in duration-700">
            <div className="w-full max-w-5xl flex flex-col bg-slate-950/95 backdrop-blur-2xl text-white rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.65)] border border-white/15">
                {/* Modern Header Bar */}
                <div className="flex items-center justify-between px-8 py-5 bg-linear-to-r from-white/5 via-white/10 to-white/5 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        {match.showTournamentLogo !== false && match.tournamentLogo && (
                            <div className="relative w-12 h-12">
                                <Image src={match.tournamentLogo} alt="Logo" fill className="object-contain" />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-[#FF5A09] uppercase tracking-[0.2em]">Match Overview</span>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-tight">{tournamentName}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {match.status === 'completed' && (
                            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-500/20">
                                COMPLETED
                            </span>
                        )}
                        <span className="px-3.5 py-1.5 rounded-xl bg-white/10 text-xs font-black uppercase tracking-wider text-slate-300 border border-white/10">
                            {courtName}
                        </span>
                        <span className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-[#FF5A09] to-[#CC4807] text-xs font-black uppercase tracking-wider text-white shadow-md shadow-orange-500/20">
                            {matchCategory}
                        </span>
                        {matchType && (
                            <span className="px-3.5 py-1.5 rounded-xl bg-white/10 text-xs font-black uppercase tracking-wider text-slate-300 border border-white/10">
                                {matchType}
                            </span>
                        )}
                    </div>
                </div>

                {/* Player Score Grid */}
                <div className="flex items-stretch h-36 border-b border-white/10 divide-x divide-white/10">
                    {/* Player 1 Side */}
                    <div className="flex-1 flex items-center justify-between px-10 bg-linear-to-br from-white/5 to-transparent">
                        <div className="flex flex-col items-start justify-center pr-4">
                            <span className="text-3xl font-black text-white uppercase tracking-tight line-clamp-1">
                                {p1Name}
                            </span>
                            {p1Name2 && (
                                <span className="text-2xl font-bold text-slate-400 uppercase tracking-tight line-clamp-1 mt-0.5">
                                    {p1Name2}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {gameScores.map((box) => (
                                <div
                                    key={box.gameNumber}
                                    className={clsx(
                                        "flex flex-col items-center justify-center shadow-lg border transition-all",
                                        box.isCurrent
                                            ? "min-w-16 h-20 rounded-2xl px-3 bg-linear-to-br from-[#FF5A09] to-[#CC4807] border-orange-400/40 shadow-[0_0_20px_rgba(255,90,9,0.35)]"
                                            : box.p1Winner
                                            ? "min-w-12.5 h-16 rounded-xl px-2 bg-amber-500/25 border-amber-400/60 text-amber-300 shadow-md"
                                            : "min-w-12.5 h-16 rounded-xl px-2 bg-white/5 border-white/5 opacity-60"
                                    )}
                                >
                                    <span className="text-[9px] font-black uppercase text-white/60 tracking-wider">Set {box.gameNumber}</span>
                                    <span className={clsx(
                                        "tabular-nums drop-shadow-md",
                                        box.isCurrent ? "text-3xl font-black text-white" : box.p1Winner ? "text-xl font-black text-amber-300" : "text-xl font-medium text-white/40"
                                    )}>{box.p1Score}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* VS Badge Center */}
                    <div className="w-20 flex items-center justify-center bg-slate-900/80">
                        <span className="text-xl font-black italic text-slate-400 uppercase tracking-wider">VS</span>
                    </div>

                    {/* Player 2 Side */}
                    <div className="flex-1 flex items-center justify-between px-10 bg-linear-to-bl from-white/5 to-transparent">
                        <div className="flex items-center gap-2">
                            {gameScores.map((box) => (
                                <div
                                    key={box.gameNumber}
                                    className={clsx(
                                        "flex flex-col items-center justify-center shadow-lg border transition-all",
                                        box.isCurrent
                                            ? "min-w-16 h-20 rounded-2xl px-3 bg-linear-to-br from-[#FF5A09] to-[#CC4807] border-orange-400/40 shadow-[0_0_20px_rgba(255,90,9,0.35)]"
                                            : box.p2Winner
                                            ? "min-w-12.5 h-16 rounded-xl px-2 bg-amber-500/25 border-amber-400/60 text-amber-300 shadow-md"
                                            : "min-w-12.5 h-16 rounded-xl px-2 bg-white/5 border-white/5 opacity-60"
                                    )}
                                >
                                    <span className="text-[9px] font-black uppercase text-white/60 tracking-wider">Set {box.gameNumber}</span>
                                    <span className={clsx(
                                        "tabular-nums drop-shadow-md",
                                        box.isCurrent ? "text-3xl font-black text-white" : box.p2Winner ? "text-xl font-black text-amber-300" : "text-xl font-medium text-white/40"
                                    )}>{box.p2Score}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-end justify-center pl-4 text-right">
                            <span className="text-3xl font-black text-white uppercase tracking-tight line-clamp-1">
                                {p2Name}
                            </span>
                            {p2Name2 && (
                                <span className="text-2xl font-bold text-slate-400 uppercase tracking-tight line-clamp-1 mt-0.5">
                                    {p2Name2}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Sponsor Bar */}
                {activeSponsor && (
                    <div className="py-3 px-8 bg-black/40 flex items-center justify-center gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Proudly Sponsored By</span>
                        <div className="h-7 relative w-28">
                            <img src={activeSponsor.advertUrl} alt={activeSponsor.name} className="h-full w-auto object-contain max-w-[110px]" />
                        </div>
                        <span className="text-sm font-black text-white">{activeSponsor.name}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
