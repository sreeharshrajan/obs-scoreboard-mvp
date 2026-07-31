import React from 'react';
import { MatchState } from "@/types/match";
import Image from "next/image";
import { Shield } from 'lucide-react';
import { getMatchDetails, Sponsor } from '@/lib/matchHelpers';

interface ClassicFullScreenMatchInfoProps {
    match: MatchState;
    sponsors: Sponsor[];
    currentSponsorIndex: number;
}

export default function ClassicFullScreenMatchInfo({ match, sponsors, currentSponsorIndex }: ClassicFullScreenMatchInfoProps) {
    if (!match.showFullScreenMatchDetails) return null;

    const {
        p1Name,
        p1Name2,
        p2Name,
        p2Name2,
        p1Score,
        p2Score,
        tournamentName,
        matchCategory,
        courtName,
        activeSponsor,
    } = getMatchDetails(match, sponsors, currentSponsorIndex);

    return (
        <div className="absolute inset-x-0 bottom-16 flex justify-center z-30 pointer-events-none font-serif px-12 animate-in slide-in-from-bottom-12 fade-in duration-700">
            <div className="w-full max-w-5xl flex flex-col bg-slate-900 text-white rounded-lg overflow-hidden shadow-2xl border-2 border-amber-400/80">
                {/* Classic Header */}
                <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border-b border-amber-400/40">
                    <div className="flex items-center gap-4">
                        {match.showTournamentLogo !== false && match.tournamentLogo ? (
                            <div className="relative w-12 h-12">
                                <Image src={match.tournamentLogo} alt="Logo" fill className="object-contain" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400 font-sans">
                                <Shield size={22} />
                            </div>
                        )}
                        <div className="flex flex-col font-sans">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Match Details</span>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">{tournamentName}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 font-sans">
                        <span className="px-3 py-1 bg-slate-800 text-xs font-bold text-amber-300 border border-amber-400/30 rounded uppercase">
                            {courtName}
                        </span>
                        <span className="px-3 py-1 bg-amber-500 text-xs font-black text-slate-950 rounded uppercase tracking-wider">
                            {matchCategory}
                        </span>
                    </div>
                </div>

                {/* Score Section */}
                <div className="flex items-stretch h-36 font-sans bg-slate-950 divide-x border-b border-slate-800">
                    {/* Player 1 */}
                    <div className="flex-1 flex items-center justify-between px-10 bg-slate-900/90">
                        <div className="flex flex-col items-start pr-4">
                            <span className="text-3xl font-black text-white uppercase tracking-wide line-clamp-1">
                                {p1Name}
                            </span>
                            {p1Name2 && (
                                <span className="text-xl font-bold text-amber-200 uppercase tracking-wide line-clamp-1 mt-1">
                                    {p1Name2}
                                </span>
                            )}
                        </div>
                        <div className="w-20 h-20 bg-amber-500 rounded border border-amber-300 flex items-center justify-center shadow-lg">
                            <span className="text-4xl font-black text-slate-950 tabular-nums">{p1Score}</span>
                        </div>
                    </div>

                    {/* VS */}
                    <div className="w-16 flex items-center justify-center bg-slate-800">
                        <span className="text-xl font-black text-amber-400 italic">VS</span>
                    </div>

                    {/* Player 2 */}
                    <div className="flex-1 flex items-center justify-between px-10 bg-slate-900/90">
                        <div className="w-20 h-20 bg-amber-500 rounded border border-amber-300 flex items-center justify-center shadow-lg">
                            <span className="text-4xl font-black text-slate-950 tabular-nums">{p2Score}</span>
                        </div>
                        <div className="flex flex-col items-end pl-4 text-right">
                            <span className="text-3xl font-black text-white uppercase tracking-wide line-clamp-1">
                                {p2Name}
                            </span>
                            {p2Name2 && (
                                <span className="text-xl font-bold text-amber-200 uppercase tracking-wide line-clamp-1 mt-1">
                                    {p2Name2}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Classic Sponsor Footer */}
                {activeSponsor && (
                    <div className="py-2.5 px-8 bg-slate-950 flex items-center justify-center gap-4 font-sans border-t border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sponsored By</span>
                        <img src={activeSponsor.advertUrl} alt={activeSponsor.name} className="h-6 w-auto object-contain max-w-[120px]" />
                        <span className="text-sm font-bold text-amber-400 uppercase">{activeSponsor.name}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
