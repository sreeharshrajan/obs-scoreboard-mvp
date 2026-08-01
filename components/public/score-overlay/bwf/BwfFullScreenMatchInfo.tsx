import React, { useState, useEffect } from 'react';
import { MatchState } from "@/types/match";
import Image from "next/image";
import { Timer } from 'lucide-react';
import { getMatchDetails, Sponsor } from '@/lib/matchHelpers';
import clsx from 'clsx';

interface BwfFullScreenMatchInfoProps {
    match: MatchState;
    sponsors: Sponsor[];
    currentSponsorIndex: number;
    elapsedDisplay?: number;
}

export default function BwfFullScreenMatchInfo({ match, sponsors, currentSponsorIndex, elapsedDisplay }: BwfFullScreenMatchInfoProps) {
    const [now, setNow] = useState<Date | null>(null);
    const [liveElapsed, setLiveElapsed] = useState<number>(elapsedDisplay ?? 0);

    // Live Date State
    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Match Timer State
    useEffect(() => {
        if (elapsedDisplay !== undefined) {
            setLiveElapsed(elapsedDisplay);
            return;
        }

        if (!match?.isTimerRunning) {
            setLiveElapsed(match?.timerElapsed || 0);
            return;
        }

        const calc = () => {
            const currentTime = Date.now();
            const startTime = match.timerStartTime ?? currentTime;
            return (match.timerElapsed || 0) + (currentTime - startTime) / 1000;
        };

        setLiveElapsed(calc());
        const timerInterval = setInterval(() => setLiveElapsed(calc()), 200);

        return () => clearInterval(timerInterval);
    }, [elapsedDisplay, match?.isTimerRunning, match?.timerStartTime, match?.timerElapsed]);

    if (!match.showFullScreenMatchDetails) return null;

    const formattedDate = now ? now.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) : '';

    const formatMatchTimer = (seconds: number) => {
        const safeSecs = isNaN(seconds) ? 0 : Math.max(0, Math.floor(seconds));
        const hrs = Math.floor(safeSecs / 3600);
        const mins = Math.floor((safeSecs % 3600) / 60);
        const secs = safeSecs % 60;
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

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
                {/* Top Section - BWF Header */}
                <div className="flex h-24 bg-linear-to-r from-emerald-50 via-white to-emerald-50 items-center justify-between px-8 border-b border-slate-200">
                    {/* Left: Logo */}
                    <div className="w-48 flex items-center justify-start">
                        {match.showTournamentLogo !== false && match.tournamentLogo && (
                            <div className="relative w-14 h-14 shrink-0">
                                <Image src={match.tournamentLogo} alt="Logo" fill className="object-contain mix-blend-multiply" />
                            </div>
                        )}
                    </div>

                    {/* Center: Tournament Name & Date */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase text-center w-full">
                            {tournamentName}
                        </h2>
                        {formattedDate && (
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                                {formattedDate}
                            </span>
                        )}
                    </div>

                    {/* Right: Unbadged Court & Category Text */}
                    <div className="w-48 flex flex-col items-end justify-center text-right">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            {courtName}
                        </span>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-0.5">
                            {matchCategory}
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
                        <div className="flex items-center gap-1.5">
                            {gameScores.map((box) => (
                                <div
                                    key={box.gameNumber}
                                    className={clsx(
                                        "rounded flex flex-col items-center justify-center border shadow-inner transition-all",
                                        box.isCurrent
                                            ? "w-14 h-16 bg-[#38b77a] text-white border-[#2e9c67]"
                                            : box.p1Winner
                                            ? "w-11 h-14 bg-amber-400 text-slate-950 border-amber-500 font-black shadow-md"
                                            : "w-11 h-14 bg-slate-200 text-slate-500 border-slate-300 opacity-60 font-medium"
                                    )}
                                >
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Set {box.gameNumber}</span>
                                    <span className={clsx("tabular-nums", box.isCurrent ? "text-2xl font-black" : box.p1Winner ? "text-lg font-black text-slate-950" : "text-lg font-medium text-slate-500")}>{box.p1Score}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* VS & Match Timer Center Badge */}
                    <div className="w-28 flex flex-col items-center justify-center bg-slate-800 px-2 py-3 gap-1 shrink-0">
                        <span className="text-2xl font-black text-white leading-none">Vs</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700/80 text-[#38b77a] font-mono font-bold text-xs border border-slate-600">
                            <Timer size={11} className={clsx(match.isTimerRunning && "animate-pulse")} />
                            <span className="tabular-nums text-[11px] tracking-wider text-white font-bold">{formatMatchTimer(liveElapsed)}</span>
                        </div>
                    </div>

                    {/* Player 2 */}
                    <div className="flex-1 flex items-center justify-between px-8">
                        <div className="flex items-center gap-1.5">
                            {gameScores.map((box) => (
                                <div
                                    key={box.gameNumber}
                                    className={clsx(
                                        "rounded flex flex-col items-center justify-center border shadow-inner transition-all",
                                        box.isCurrent
                                            ? "w-14 h-16 bg-[#38b77a] text-white border-[#2e9c67]"
                                            : box.p2Winner
                                            ? "w-11 h-14 bg-amber-400 text-slate-950 border-amber-500 font-black shadow-md"
                                            : "w-11 h-14 bg-slate-200 text-slate-500 border-slate-300 opacity-60 font-medium"
                                    )}
                                >
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Set {box.gameNumber}</span>
                                    <span className={clsx("tabular-nums", box.isCurrent ? "text-2xl font-black" : box.p2Winner ? "text-lg font-black text-slate-950" : "text-lg font-medium text-slate-500")}>{box.p2Score}</span>
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
