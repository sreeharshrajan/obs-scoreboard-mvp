import React from 'react';
import { MatchState } from "@/types/match";
import Image from "next/image";
import { getMatchDetails, Sponsor } from '@/lib/matchHelpers';
import clsx from 'clsx';

interface BwfFullScreenMatchInfoProps {
    match: MatchState;
    sponsors: Sponsor[];
    currentSponsorIndex: number;
}

export default function BwfFullScreenMatchInfo({ match, sponsors, currentSponsorIndex }: BwfFullScreenMatchInfoProps) {
    if (!match.showFullScreenMatchDetails) return null;

    const {
        p1Name,
        p1Name2,
        p2Name,
        p2Name2,
        tournamentName,
        matchCategory,
        courtName,
        activeSponsor,
        gameScores,
    } = getMatchDetails(match, sponsors, currentSponsorIndex);

    return (
        <div className="absolute inset-x-0 bottom-16 flex justify-center z-30 pointer-events-none font-sans px-12 animate-in slide-in-from-bottom-12 fade-in duration-700">
            <div className="w-full max-w-5xl flex flex-col shadow-2xl rounded-xl overflow-hidden border border-white/20">
                {/* Top Section - Light background */}
                <div className="flex h-24 bg-gradient-to-r from-emerald-50 via-white to-emerald-50">
                    {/* Left Logo Placeholder */}
                    <div className="w-48 flex items-center justify-center p-4">
                        {match.showTournamentLogo !== false && match.tournamentLogo && (
                            <div className="relative w-full h-full">
                                <Image src={match.tournamentLogo} alt="Logo" fill className="object-contain" />
                            </div>
                        )}
                    </div>

                    {/* Title Center */}
                    <div className="flex-1 flex flex-col items-center justify-center pt-2">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                            CURRENT MATCH
                        </h2>
                        <h3 className="text-lg font-bold text-slate-700 uppercase tracking-widest mt-1">
                            {courtName} - {matchCategory}
                        </h3>
                    </div>

                    {/* Right Logo Placeholder */}
                    <div className="w-48 flex flex-col items-center justify-center p-4 text-center">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                            {tournamentName}
                        </span>
                    </div>
                </div>

                {/* Bottom Section - Players */}
                <div className="flex h-32 bg-[#e6e7e8] border-t border-slate-300">
                    {/* Player 1 */}
                    <div className="flex-1 flex items-center justify-between px-8">
                        <div className="flex flex-col items-start justify-center">
                            <span className="text-4xl font-black text-slate-800 uppercase tracking-tight text-left line-clamp-1 leading-none">
                                {p1Name}
                            </span>
                            {p1Name2 && (
                                <span className="text-4xl font-black text-slate-800 uppercase tracking-tight text-left line-clamp-1 leading-none mt-1">
                                    {p1Name2}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {gameScores.map((box) => (
                                <div
                                    key={box.gameNumber}
                                    className={clsx(
                                        "w-14 h-16 rounded flex flex-col items-center justify-center border shadow-inner transition-all",
                                        box.isCurrent
                                            ? "bg-[#38b77a] text-white border-[#2e9c67]"
                                            : box.p1Winner
                                            ? "bg-slate-300 text-slate-900 border-slate-400 font-bold"
                                            : "bg-slate-200 text-slate-400 border-slate-300"
                                    )}
                                >
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">G{box.gameNumber}</span>
                                    <span className="text-2xl font-black">{box.p1Score}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* VS */}
                    <div className="w-24 flex items-center justify-center bg-slate-800">
                        <span className="text-3xl font-black text-white">V</span>
                    </div>

                    {/* Player 2 */}
                    <div className="flex-1 flex items-center justify-between px-8">
                        <div className="flex items-center gap-2">
                            {gameScores.map((box) => (
                                <div
                                    key={box.gameNumber}
                                    className={clsx(
                                        "w-14 h-16 rounded flex flex-col items-center justify-center border shadow-inner transition-all",
                                        box.isCurrent
                                            ? "bg-[#38b77a] text-white border-[#2e9c67]"
                                            : box.p2Winner
                                            ? "bg-slate-300 text-slate-900 border-slate-400 font-bold"
                                            : "bg-slate-200 text-slate-400 border-slate-300"
                                    )}
                                >
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">G{box.gameNumber}</span>
                                    <span className="text-2xl font-black">{box.p2Score}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-end justify-center">
                            <span className="text-4xl font-black text-slate-800 uppercase tracking-tight text-right line-clamp-1 leading-none">
                                {p2Name}
                            </span>
                            {p2Name2 && (
                                <span className="text-4xl font-black text-slate-800 uppercase tracking-tight text-right line-clamp-1 leading-none mt-1">
                                    {p2Name2}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Optional Footer: Sponsors */}
                {activeSponsor && (
                    <div className="h-14 bg-white flex items-center justify-center border-t border-slate-200 gap-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sponsored By</span>
                        <div className="h-8 relative w-24">
                            <Image src={activeSponsor.advertUrl} alt={activeSponsor.name} fill className="object-contain" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
