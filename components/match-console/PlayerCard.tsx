import { Minus, Plus, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { PlayerState, MatchState } from '@/types/match';
import { memo } from 'react';

interface PlayerCardProps {
    player: PlayerState;
    teamLabel: string;
    isServing: boolean;
    isCompleted: boolean;
    onScoreChange: (delta: number) => void;
    onToggleServer: () => void;
    matchType: MatchState['matchType'];
    gamesWon?: number;
    totalGames?: number;
    lastGameScore?: number;
}

export default memo(function PlayerCard({
    player,
    teamLabel,
    isServing,
    isCompleted,
    onScoreChange,
    onToggleServer,
    matchType,
    gamesWon = 0,
    totalGames = 3,
    lastGameScore,
}: PlayerCardProps) {
    const gamesNeeded = Math.ceil(totalGames / 2);
    const isWinner = gamesWon >= gamesNeeded;
    const isFinished = isCompleted || isWinner;

    const displayScore = isFinished
        ? (player.score === 0 && lastGameScore !== undefined ? lastGameScore : player.score)
        : player.score;

    return (
        <div className={clsx(
            // RESTORED lg:col-span-4 to fix the squished width
            "w-full lg:col-span-4 h-auto lg:h-auto rounded-lg border-2 transition-all duration-300 p-6 lg:p-7 relative overflow-hidden flex flex-col justify-between",
            isWinner
                ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500 shadow-2xl shadow-amber-500/10"
                : isServing && !isFinished
                    ? "bg-white dark:bg-[#1E1E1E] border-[#FF5A09] shadow-2xl shadow-[#FF5A09]/10"
                    : "bg-white dark:bg-[#1E1E1E] border-slate-100 dark:border-white/5 shadow-xl"
        )}>
            {/* Top Bar: Header & Badges */}
            <div className="w-full">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-[#FF5A09] uppercase tracking-[0.2em]">
                            {teamLabel}
                        </span>
                        {isServing && !isFinished && (
                            <div className="lg:hidden w-2 h-2 bg-[#FF5A09] rounded-full animate-pulse" />
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Sets Won Badge */}
                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                            Sets: {gamesWon}
                        </span>

                        {/* Desktop Serving Badge */}
                        {isServing && !isFinished && (
                            <div className="hidden lg:flex items-center gap-1.5 bg-[#FF5A09] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md animate-in fade-in zoom-in">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                Serving
                            </div>
                        )}

                        {/* Winner Badge */}
                        {isWinner && (
                            <div className="flex items-center gap-1.5 bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                                <Trophy size={12} className="text-slate-950" />
                                Winner
                            </div>
                        )}
                    </div>
                </div>

                {/* Player Names Container */}
                <div className="space-y-0.5 my-4 flex flex-col justify-center">
                    <div className="text-xl lg:text-2xl font-extrabold font-instrument italic text-slate-900 dark:text-white truncate">
                        {player.name || "Player 1"}
                        {(matchType === "Doubles" || matchType === "Mixed Doubles" || player.name2) && (
                            <>
                                <span className="font-semibold ml-2 text-xl text-slate-500 dark:text-slate-400"> & </span>
                                <span className="font-semibold ml-2 text-xl text-slate-500 dark:text-slate-400">{player.name2 || "—"}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Middle Section: Display Score */}
            <div className="flex flex-col items-center justify-center my-2">
                <span className="text-7xl lg:text-9xl font-bold font-instrument tracking-tighter text-slate-900 dark:text-white tabular-nums leading-none select-none">
                    {displayScore}
                </span>
            </div>

            {/* Bottom Controls Area */}
            <div className="w-full space-y-3 my-2">
                {/* Score Modifier Buttons */}
                {!isCompleted && (
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => onScoreChange(-1)}
                            className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer active:scale-95"
                            title="Subtract Point"
                        >
                            <Minus size={20} />
                        </button>

                        {!isWinner && (
                            <button
                                onClick={() => onScoreChange(1)}
                                className="flex-1 max-w-[140px] h-12 rounded-2xl bg-[#FF5A09] text-white shadow-lg shadow-[#FF5A09]/20 flex items-center justify-center hover:bg-[#E04F08] active:scale-95 transition-all cursor-pointer"
                                title="Add Point"
                            >
                                <Plus size={24} />
                            </button>
                        )}
                    </div>
                )}

                {/* Mark as Server Action Button */}
                {!isFinished && (
                    <button
                        onClick={onToggleServer}
                        className={clsx(
                            "w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer active:scale-98 m-1",
                            isServing
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                                : "bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                    >
                        {isServing ? "Active Server" : "Mark as Server"}
                    </button>
                )}
            </div>
        </div>
    );
});