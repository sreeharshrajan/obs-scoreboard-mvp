'use client';

import React from 'react';
import { Trophy, X, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { MatchState } from '@/types/match';
import { getGameStructure } from '@/lib/matchHelpers';

interface EndMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    match: MatchState | null;
}

export default function EndMatchModal({
    isOpen,
    onClose,
    onConfirm,
    match,
}: EndMatchModalProps) {
    if (!isOpen || !match) return null;

    const p1Name = [match.player1?.name, match.player1?.name2].filter(Boolean).join(" & ") || "Team 1";
    const p2Name = [match.player2?.name, match.player2?.name2].filter(Boolean).join(" & ") || "Team 2";

    const { p1GamesWon: p1Games, p2GamesWon: p2Games } = getGameStructure(match);

    const isP1Winner = p1Games > p2Games;
    const isP2Winner = p2Games > p1Games;
    const winnerName = isP1Winner ? p1Name : isP2Winner ? p2Name : null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-200 flex flex-col gap-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                    title="Cancel"
                >
                    <X size={18} />
                </button>

                {/* Header Icon & Title */}
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#FF5A09]/10 border border-[#FF5A09]/20 flex items-center justify-center text-[#FF5A09] shrink-0">
                        <Trophy size={28} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5A09] mb-1">
                            End Match Confirmation
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                            {winnerName ? "Confirm Match Winner" : "Finalize Match"}
                        </h2>
                    </div>
                </div>

                {/* Winner Card */}
                {winnerName ? (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                        <CheckCircle2 size={22} className="text-amber-500 shrink-0" />
                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                                Winner
                            </span>
                            <span className="text-base font-black text-slate-900 dark:text-white leading-snug">
                                {winnerName}
                            </span>
                        </div>
                    </div>
                ) : null}

                {/* Score Breakdown Box */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Match Score Summary
                    </span>
                    <div className="flex items-center justify-between text-sm font-bold">
                        <span className={clsx(isP1Winner ? "text-slate-900 dark:text-white font-black" : "text-slate-500 dark:text-slate-400")}>
                            {p1Name}
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-white dark:bg-white/10 text-slate-900 dark:text-white font-black text-base border border-slate-200 dark:border-white/10">
                            {p1Games}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold">
                        <span className={clsx(isP2Winner ? "text-slate-900 dark:text-white font-black" : "text-slate-500 dark:text-slate-400")}>
                            {p2Name}
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-white dark:bg-white/10 text-slate-900 dark:text-white font-black text-base border border-slate-200 dark:border-white/10">
                            {p2Games}
                        </span>
                    </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center">
                    Are you sure you want to end this match? Completing the match will stop the clock and finalize the official results.
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-center"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 py-3.5 px-4 rounded-xl bg-[#FF5A09] hover:bg-[#E04F08] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FF5A09]/25 transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
                    >
                        <Trophy size={16} />
                        Confirm &amp; End
                    </button>
                </div>
            </div>
        </div>
    );
}
