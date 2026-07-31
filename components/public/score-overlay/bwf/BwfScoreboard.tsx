import React from 'react';
import { Activity } from "lucide-react";
import clsx from 'clsx';
import { MatchState } from "@/types/match";
import { getGameStructure, getPerGameScores } from "@/lib/matchHelpers";
import Image from "next/image";

interface BwfScoreboardProps {
    match: MatchState;
    elapsedDisplay: number;
}

function ShuttlecockIcon({ className = "w-5 h-5 text-[#3aa372]" }: { className?: string }) {
    return (
        <svg
            viewBox="0 -0.42 42.356 42.356"
            fill="currentColor"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                id="shuttlecock"
                d="M157.288,169.268l2.295,5.865s-8.735,11.6-9.88,13.583-4.124,3.328-4.124,3.328l-1.666,3.2,2.738,2.738,1.709-1.709a49.942,49.942,0,0,1,2.636-5.656c1.212-2.013,9.826-13.669,9.826-13.669L167.7,178.3l1.354,6.882s-11.6,8.556-13.669,9.826a46.424,46.424,0,0,1-5.656,2.636l-1.709,1.709,2.693,2.693,3.363-1.745s1.327-2.963,3.3-4.1,13.5-9.8,13.5-9.8l5.852,2.307-1.6,5.511s-13.267,5.661-15.275,6.735a48.208,48.208,0,0,1-5.477,1.733l-6.765,3.887.711.711-2.45,2.45-.092-.092a6.523,6.523,0,0,1-8.253-.714l-1.83-1.83c-2.214-2.214-1.388-4.625.6-6.938l-.034-.034.942-.942h0l1.508-1.508.665.665,3.8-6.589a21.029,21.029,0,0,1,1.759-5.5c1.146-1.986,6.814-15.355,6.814-15.355l5.536-1.63M142.993,197l-1.7,3.259,2.223,2.223-.686-.686,2.479-2.479Zm3.689,3.689L144.2,203.17l1.483,1.483,3.265-1.694Z"
                transform="translate(-134.376 -169.268)"
            />
        </svg>
    );
}

export default function BwfScoreboard({ match, elapsedDisplay }: BwfScoreboardProps) {
    const p1Name = match.player1?.name2
        ? `${match.player1.name} / ${match.player1.name2}`
        : match.player1?.name || "Player 1";
    const p2Name = match.player2?.name2
        ? `${match.player2.name} / ${match.player2.name2}`
        : match.player2?.name || "Player 2";

    const currentServer = match.currentServer ?? (match.player1?.isServing ? 'player1' : 'player2');
    const p1Serving = currentServer === 'player1';
    const p2Serving = currentServer === 'player2';

    // BWF style green gradient for the active score
    const scoreBgGradient = "bg-gradient-to-b from-[#56ba87] via-[#3fa675] to-[#287e54]";

    const gameScores = getPerGameScores(match);

    return (
        <div className="absolute top-12 left-12 flex flex-row items-stretch shadow-2xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-left-8 duration-700 font-sans border border-white/20">
            {/* Logo - Vertically Centered Across Entire Scoreboard */}
            {match.showTournamentLogo !== false && match.tournamentLogo && (
                <div className="w-14 bg-white flex items-center justify-center p-2 border-r border-slate-300 self-stretch">
                    <div className="relative w-10 h-10">
                        <Image src={match.tournamentLogo} alt="Logo" fill className="object-contain" />
                    </div>
                </div>
            )}

            <div className="flex flex-col flex-1 relative">
                {/* Player 1 Row */}
                <div className="flex items-stretch h-[44px] bg-[#e6e7e8] border-b border-slate-300">

                    {/* Name */}
                    <div className="flex-1 flex items-center px-4 min-w-75 relative">
                        <span className="text-lg font-medium text-slate-800 uppercase tracking-tight line-clamp-1">{p1Name}</span>

                        {/* Serving Indicator */}
                        {p1Serving && (
                            <div className="absolute right-3 flex items-center justify-center">
                                <ShuttlecockIcon className="w-5 h-5 text-[#3aa372]" />
                            </div>
                        )}
                    </div>

                    {/* Per-game Score Columns */}
                    <div className="flex items-stretch">
                        {gameScores.map((box) => (
                            <div
                                key={box.gameNumber}
                                className={clsx(
                                    "w-12 flex items-center justify-center border-l border-black/10 transition-all",
                                    box.isCurrent
                                        ? scoreBgGradient
                                        : box.isCompleted
                                        ? "bg-slate-300 text-slate-900 font-bold"
                                        : "bg-slate-200 text-slate-400"
                                )}
                            >
                                <span className={clsx("text-2xl font-medium", box.isCurrent ? "text-white drop-shadow-sm" : "text-slate-800")}>
                                    {box.p1Score}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Player 2 Row */}
                <div className="flex items-stretch h-[44px] bg-[#e6e7e8]">

                    {/* Name */}
                    <div className="flex-1 flex items-center px-4 min-w-75 relative">
                        <span className="text-lg font-medium text-slate-800 uppercase tracking-tight line-clamp-1">{p2Name}</span>

                        {/* Serving Indicator */}
                        {p2Serving && (
                            <div className="absolute right-3 flex items-center justify-center">
                                <ShuttlecockIcon className="w-5 h-5 text-[#3aa372]" />
                            </div>
                        )}
                    </div>

                    {/* Per-game Score Columns */}
                    <div className="flex items-stretch">
                        {gameScores.map((box) => (
                            <div
                                key={box.gameNumber}
                                className={clsx(
                                    "w-12 flex items-center justify-center border-l border-black/10 transition-all",
                                    box.isCurrent
                                        ? scoreBgGradient
                                        : box.isCompleted
                                        ? "bg-slate-300 text-slate-900 font-bold"
                                        : "bg-slate-200 text-slate-400"
                                )}
                            >
                                <span className={clsx("text-2xl font-medium", box.isCurrent ? "text-white drop-shadow-sm" : "text-slate-800")}>
                                    {box.p2Score}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Match Status / Break */}
                {match.status === 'break' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-lg font-medium uppercase text-white animate-pulse tracking-widest">BREAK</span>
                    </div>
                )}
            </div>
        </div>
    );
}
