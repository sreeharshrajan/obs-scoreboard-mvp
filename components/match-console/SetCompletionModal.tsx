'use client';

import React from 'react';
import { Trophy, CheckCircle2, X } from 'lucide-react';
import clsx from 'clsx';

interface SetCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    winnerName: string;
    winnerTeamLabel: string;
    gameNumber: number;
    p1Name: string;
    p2Name: string;
    p1Score: number;
    p2Score: number;
    isMatchPoint: boolean;
}

export default function SetCompletionModal({
    isOpen,
    onClose,
    onConfirm,
    winnerName,
    winnerTeamLabel,
    gameNumber,
    p1Name,
    p2Name,
    p1Score,
    p2Score,
    isMatchPoint,
}: SetCompletionModalProps) {
    if (!isOpen) return null;

    // Single source of truth for text & badge elements derived from isMatchPoint
    const badgeText = isMatchPoint ? `MATCH POINT • SET ${gameNumber}` : `SET POINT • SET ${gameNumber}`;
    const titleText = isMatchPoint ? "Confirm Match Win" : "Confirm Set Win";
    const descriptionText = isMatchPoint
        ? "Completing this set will finish the match. Would you like to proceed?"
        : `Completing this set will mark Set ${gameNumber} as complete and begin Set ${gameNumber + 1}.`;
    const buttonText = isMatchPoint ? "Finish Match" : "Complete Set";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
            <div 
                className="relative w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-6 lg:p-8 animate-in zoom-in-95 duration-200 flex flex-col gap-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                    title="Cancel"
                >
                    <X size={18} />
                </button>

                {/* Header Icon & Title */}
                <div className="flex items-center gap-4">
                    <div className={clsx(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                        isMatchPoint
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-amber-500/10"
                            : "bg-[#FF5A09]/10 text-[#FF5A09] border border-[#FF5A09]/20 shadow-[#FF5A09]/10"
                    )}>
                        {isMatchPoint ? <Trophy size={28} /> : <CheckCircle2 size={28} />}
                    </div>
                    <div>
                        <span className={clsx(
                            "text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full inline-block mb-1",
                            isMatchPoint 
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-[#FF5A09]/15 text-[#FF5A09]"
                        )}>
                            {badgeText}
                        </span>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                            {titleText}
                        </h2>
                    </div>
                </div>

                {/* Main Content Box */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-white">{winnerName}</span> ({winnerTeamLabel}) has reached the game point to win <span className="font-bold text-slate-900 dark:text-white">Set {gameNumber}</span>.
                    </div>

                    {/* Score Summary Box */}
                    <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[130px]">{p1Name}</span>
                            <span className="text-2xl font-black font-instrument text-slate-900 dark:text-white">{p1Score}</span>
                        </div>
                        <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">
                            VS
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[130px]">{p2Name}</span>
                            <span className="text-2xl font-black font-instrument text-slate-900 dark:text-white">{p2Score}</span>
                        </div>
                    </div>
                </div>

                {/* Confirmation Prompt */}
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {descriptionText}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-5 py-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 active:scale-95 transition-all cursor-pointer"
                    >
                        No, Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={clsx(
                            "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-2",
                            isMatchPoint
                                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/25"
                                : "bg-[#FF5A09] hover:bg-[#E04F08] shadow-[#FF5A09]/25"
                        )}
                    >
                        {isMatchPoint ? <Trophy size={16} /> : <CheckCircle2 size={16} />}
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
}
