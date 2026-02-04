
import { RotateCcw, Plus } from 'lucide-react';
import clsx from 'clsx';
import { PlayerState, MatchState } from '@/types/match';

interface PlayerCardProps {
    player: PlayerState;
    teamLabel: string;
    isServing: boolean;
    isCompleted: boolean;
    onScoreChange: (delta: number) => void;
    onToggleServer: () => void;
    matchType: MatchState['matchType'];
}

export default function PlayerCard({
    player,
    teamLabel,
    isServing,
    isCompleted,
    onScoreChange,
    onToggleServer,
    matchType
}: PlayerCardProps) {
    return (
        <div className={clsx(
            "lg:col-span-4 rounded-[2rem] border-2 transition-all duration-500 flex flex-col p-8 relative overflow-hidden",
            isServing
                ? "bg-white dark:bg-[#252525] border-[#FF5A09] shadow-2xl shadow-[#FF5A09]/5"
                : "bg-slate-50/50 dark:bg-white/[0.02] border-transparent"
        )}>
            {isServing && (
                <div className="absolute top-6 right-6 flex items-center gap-2 bg-[#FF5A09] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Serving
                </div>
            )}

            <div className="mb-4">
                <span className="text-xs font-black text-[#FF5A09] uppercase tracking-[0.2em] mb-2 block">{teamLabel}</span>

                <div className="flex flex-col gap-1">
                    <div className="py-1 text-2xl font-instrument italic font-medium text-slate-900 dark:text-white w-full border-b border-transparent">
                        {player.name}
                    </div>

                    {(matchType === "Doubles" || matchType === "Mixed Doubles" || player.name2) && (
                        <div className="py-1 text-2xl font-instrument italic font-medium text-slate-900 dark:text-white w-full border-b border-transparent">
                            {player.name2}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <span className="text-7xl leading-none font-instrument font-light tracking-tighter text-slate-900 dark:text-white tabular-nums">
                    {player.score}
                </span>

                {!isCompleted && (
                    <div className="flex gap-4">
                        <button onClick={() => onScoreChange(-1)} className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-all">
                            <RotateCcw size={18} />
                        </button>
                        <button onClick={() => onScoreChange(1)} className="w-20 h-20 rounded-[2rem] bg-[#FF5A09] text-white shadow-xl shadow-[#FF5A09]/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                            <Plus size={32} />
                        </button>
                    </div>
                )}
            </div>

            {!isCompleted && (
                <button
                    onClick={onToggleServer}
                    className={clsx(
                        "mt-4 w-full py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                        isServing
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                            : "bg-slate-200/50 dark:bg-white/5 text-slate-400 hover:text-slate-600"
                    )}
                >
                    Mark as Server
                </button>
            )}
        </div>
    );
}
