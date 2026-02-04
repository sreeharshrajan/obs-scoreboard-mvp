import { Minus, Plus } from 'lucide-react';
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
}

export default memo(function PlayerCard({
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
            "w-full h-30 lg:h-[400px] lg:col-span-4 rounded-[2rem] border-2 transition-all duration-500 p-6 lg:p-8 relative overflow-hidden flex flex-row lg:flex-col items-center lg:items-stretch",
            isServing
                ? "bg-white dark:bg-[#252525] border-[#FF5A09] shadow-2xl shadow-[#FF5A09]/5"
                : "bg-slate-50/50 dark:bg-white/[0.02] border-transparent"
        )}>
            {isServing && (
                <div className="hidden lg:flex absolute top-6 right-6 items-center gap-2 bg-[#FF5A09] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest z-20 animate-in fade-in zoom-in">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Serving
                </div>
            )}

            <div className="flex-1 flex flex-col justify-center lg:justify-start lg:mb-4">
                <div className="flex items-center gap-2 mb-1 lg:mb-2">
                    <span className="text-[10px] lg:text-xs font-black text-[#FF5A09] uppercase tracking-[0.2em] block">
                        {teamLabel}
                    </span>
                    {isServing && <div className="lg:hidden w-1.5 h-1.5 bg-[#FF5A09] rounded-full animate-pulse" />}
                </div>

                <div className="flex flex-col">
                    <div className="text-lg lg:text-2xl font-instrument italic font-medium text-slate-900 dark:text-white truncate max-w-[120px] lg:max-w-none">
                        {player.name}
                    </div>
                    {(matchType === "Doubles" || matchType === "Mixed Doubles" || player.name2) && (
                        <div className="text-lg lg:text-2xl font-instrument italic font-medium text-slate-900 dark:text-white truncate max-w-[120px] lg:max-w-none">
                            {player.name2 || "—"}
                        </div>
                    )}
                </div>

                {!isCompleted && (
                    <button 
                        onClick={onToggleServer}
                        className={clsx(
                            "lg:hidden mt-2 text-[9px] font-black uppercase tracking-widest text-left transition-colors",
                            isServing ? "text-[#FF5A09]" : "text-slate-400"
                        )}
                    >
                        {isServing ? "Active Server" : "Set Server"}
                    </button>
                )}
            </div>

            <div className="flex flex-row lg:flex-col items-center justify-center gap-4 lg:gap-2 lg:flex-1">
                <span className="text-5xl lg:text-8xl lg:mb-5 leading-none font-instrument font-light tracking-tighter text-slate-900 dark:text-white tabular-nums">
                    {player.score}
                </span>

                {!isCompleted && (
                    <div className="flex items-center gap-2 lg:gap-4">
                        <button 
                            onClick={() => onScoreChange(-1)} 
                            className="w-12 h-12 rounded-xl lg:rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-all"
                        >
                            <Minus size={20} />
                        </button>
                        
                        <button 
                            onClick={() => onScoreChange(1)} 
                            className="w-12 h-12 lg:w-20 lg:h-20 rounded-xl lg:rounded-[2rem] bg-[#FF5A09] text-white shadow-lg shadow-[#FF5A09]/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus size={24} className="lg:w-8 lg:h-8" />
                        </button>
                    </div>
                )}
            </div>

            {!isCompleted && (
                <button
                    onClick={onToggleServer}
                    className={clsx(
                        "hidden lg:block mt-4 w-full py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
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
});