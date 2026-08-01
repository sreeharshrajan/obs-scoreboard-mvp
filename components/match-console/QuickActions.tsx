
import { ArrowRightLeft, Trophy, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { memo } from 'react';

interface QuickActionsProps {
    onSwap: () => void;
    onEndMatch: () => void;
    onResumeMatch?: () => void;
    onResetGame: () => void;
    isCompleted: boolean;
    isMatchWon?: boolean;
    currentGame?: number;
}

export default memo(function QuickActions({
    onSwap,
    onEndMatch,
    onResumeMatch,
    onResetGame,
    isCompleted,
    isMatchWon = false,
    currentGame = 1,
}: QuickActionsProps) {
    return (
        <>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <button
                    type="button"
                    onClick={onSwap}
                    disabled={isCompleted || isMatchWon}
                    className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-6 rounded-lg bg-white dark:bg-[#252525] border border-slate-100 dark:border-white/5 hover:border-[#FF5A09]/30 transition-all group disabled:opacity-50 disabled:hover:border-slate-100 dark:disabled:hover:border-white/5 disabled:cursor-not-allowed"
                >
                    <ArrowRightLeft size={16} className="sm:hidden text-slate-400 group-hover:text-[#FF5A09] transition-colors" />
                    <ArrowRightLeft size={20} className="hidden sm:block text-slate-400 group-hover:text-[#FF5A09] transition-colors" />
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Swap</span>
                </button>
                <button
                    type="button"
                    onClick={onResetGame}
                    disabled={isCompleted}
                    className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-6 rounded-lg bg-white dark:bg-[#252525] border border-slate-100 dark:border-white/5 hover:border-amber-500/30 transition-all group disabled:opacity-50 disabled:hover:border-slate-100 dark:disabled:hover:border-white/5 disabled:cursor-not-allowed"
                    title="Reset current game scores to 0-0"
                >
                    <RotateCcw size={16} className="sm:hidden text-slate-400 group-hover:text-amber-500 transition-colors" />
                    <RotateCcw size={20} className="hidden sm:block text-slate-400 group-hover:text-amber-500 transition-colors" />
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Reset G{currentGame}</span>
                </button>
                {!isCompleted ? (
                    <button
                        type="button"
                        onClick={onEndMatch}
                        className={clsx(
                            "flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-6 rounded-lg border transition-all group cursor-pointer",
                            isMatchWon
                                ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20 animate-pulse ring-2 ring-red-500/30"
                                : "bg-white dark:bg-[#252525] border-slate-100 dark:border-white/5 hover:border-red-500/30"
                        )}
                        title={isMatchWon ? "Confirm and End Match" : "End Match"}
                    >
                        <Trophy size={16} className={clsx("sm:hidden", isMatchWon ? "text-red-500" : "text-slate-400 group-hover:text-red-500 transition-colors")} />
                        <Trophy size={20} className={clsx("hidden sm:block", isMatchWon ? "text-red-500" : "text-slate-400 group-hover:text-red-500 transition-colors")} />
                        <span className={clsx("text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-center", isMatchWon ? "text-red-600 dark:text-red-400 font-extrabold" : "text-slate-500")}>
                            {isMatchWon ? "End" : "End"}
                        </span>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onResumeMatch || onEndMatch}
                        className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500 transition-all group cursor-pointer"
                        title="Resume / Reopen Match"
                    >
                        <RotateCcw size={16} className="sm:hidden text-emerald-500 group-hover:rotate-[-45deg] transition-transform" />
                        <RotateCcw size={20} className="hidden sm:block text-emerald-500 group-hover:rotate-[-45deg] transition-transform" />
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Resume</span>
                    </button>
                )}
            </div>
        </>
    );
});
