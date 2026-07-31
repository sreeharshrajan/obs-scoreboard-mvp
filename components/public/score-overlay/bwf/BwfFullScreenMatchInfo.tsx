import React from 'react';
import clsx from 'clsx';
import { MatchState } from "@/types/match";
import Image from "next/image";

interface BwfFullScreenMatchInfoProps {
    match: MatchState;
    sponsors: { id: string, advertUrl: string, name: string }[];
    currentSponsorIndex: number;
}

export default function BwfFullScreenMatchInfo({ match, sponsors, currentSponsorIndex }: BwfFullScreenMatchInfoProps) {
    if (!match.showFullScreenMatchDetails) return null;

    const p1Name = match.player1?.name || "Player 1";
    const p1Name2 = match.player1?.name2;
    const p2Name = match.player2?.name || "Player 2";
    const p2Name2 = match.player2?.name2;
    const p1Score = match.player1?.score || 0;
    const p2Score = match.player2?.score || 0;

    const tournamentName = match.tournamentName || "TOURNAMENT";
    const matchCategory = match.matchCategory || match.category || "MATCH";
    const courtName = match.court || "COURT 1";
    
    const showSponsor = sponsors && sponsors.length > 0 && match.isSponsorsOverlayActive;
    const activeSponsor = showSponsor ? sponsors[currentSponsorIndex] : null;

    return (
        <div className="absolute inset-x-0 bottom-16 flex justify-center z-30 pointer-events-none font-sans px-12 animate-in slide-in-from-bottom-12 fade-in duration-700">
            <div className="w-full max-w-5xl flex flex-col shadow-2xl rounded-xl overflow-hidden border border-white/20">
                {/* Top Section - Light background */}
                <div className="flex h-24 bg-gradient-to-r from-emerald-50 via-white to-emerald-50">
                    {/* Left Logo Placeholder */}
                    <div className="w-48 flex items-center justify-center p-4">
                        {match.showTournamentLogo !== false && match.tournamentLogo ? (
                            <div className="relative w-full h-full">
                                <Image src={match.tournamentLogo} alt="Logo" fill className="object-contain" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="text-emerald-500 font-bold">BWF</span>
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
                    <div className="flex-1 flex items-center justify-end px-12 relative">
                        <div className="absolute left-8 w-16 h-16 bg-[#38b77a] rounded flex items-center justify-center shadow-inner border border-[#2e9c67]">
                            <span className="text-3xl font-black text-white">{p1Score}</span>
                        </div>
                        <div className="flex flex-col items-end justify-center">
                            <span className="text-4xl font-black text-slate-800 uppercase tracking-tight text-right line-clamp-1 leading-none">
                                {p1Name}
                            </span>
                            {p1Name2 && (
                                <span className="text-4xl font-black text-slate-800 uppercase tracking-tight text-right line-clamp-1 leading-none mt-1">
                                    {p1Name2}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* VS */}
                    <div className="w-24 flex items-center justify-center bg-slate-800">
                        <span className="text-3xl font-black text-white">V</span>
                    </div>

                    {/* Player 2 */}
                    <div className="flex-1 flex items-center justify-start px-12 relative">
                        <div className="flex flex-col items-start justify-center">
                            <span className="text-4xl font-black text-slate-800 uppercase tracking-tight text-left line-clamp-1 leading-none">
                                {p2Name}
                            </span>
                            {p2Name2 && (
                                <span className="text-4xl font-black text-slate-800 uppercase tracking-tight text-left line-clamp-1 leading-none mt-1">
                                    {p2Name2}
                                </span>
                            )}
                        </div>
                        <div className="absolute right-8 w-16 h-16 bg-[#38b77a] rounded flex items-center justify-center shadow-inner border border-[#2e9c67]">
                            <span className="text-3xl font-black text-white">{p2Score}</span>
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
