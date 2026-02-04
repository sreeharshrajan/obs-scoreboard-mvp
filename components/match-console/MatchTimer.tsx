import { Clock, Pause, Play, Coffee } from 'lucide-react';
import clsx from 'clsx';
interface MatchTimerProps {
    elapsedDisplay: number;
    isTimerRunning: boolean;
    isCompleted: boolean;
    onToggleTimer: () => void;
    formatTime: (s: number) => string;
    matchStatus: string;
    isBreak: boolean;
    onToggleBreak: () => void;
}

export default function MatchTimer({
    elapsedDisplay,
    isTimerRunning,
    isCompleted,
    onToggleTimer,
    formatTime,
    matchStatus,
    isBreak,
    onToggleBreak
}: MatchTimerProps) {
    return (
        <div className={clsx(
            "flex-1 rounded-3xl border transition-all duration-300 p-5 flex flex-col items-center justify-center relative",
            isBreak 
                ? "bg-indigo-50/30 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20" 
                : "bg-white dark:bg-[#1E1E1E] border-slate-100 dark:border-white/5 shadow-sm"
        )}>
            
            {/* Compact Status Badge */}
            <div className="flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-slate-50 dark:bg-white/5">
                <Clock size={12} className={clsx(isTimerRunning && "animate-pulse text-emerald-500")} />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {isBreak ? "Break" : "Match Clock"}
                </span>
            </div>

            {/* Normal Timer Display */}
            <div className={clsx(
                "text-5xl font-semibold tabular-nums mb-6 tracking-tight transition-colors",
                isTimerRunning ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
            )}>
                {formatTime(elapsedDisplay)}
            </div>

            {!isCompleted && (
                <div className="flex gap-2 w-full max-w-[280px]">
                    {/* Primary Action: Scaled down to standard button height */}
                    <button
                        onClick={onToggleTimer}
                        className={clsx(
                            "flex-[2] py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all active:scale-[0.96] flex items-center justify-center gap-2 border",
                            isTimerRunning
                                ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:border-red-500/20"
                                : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md shadow-slate-200 dark:shadow-none"
                        )}
                    >
                        {isTimerRunning ? (
                            <Pause size={14} fill="currentColor" className="text-red-500" />
                        ) : (
                            <Play size={14} fill="currentColor" className="text-emerald-500" />
                        )}
                        {isTimerRunning ? "Pause" : "Start"}
                    </button>

                    {/* Secondary Action: Compact Break Toggle */}
                    {(matchStatus === 'live' || matchStatus === 'break') && (
                        <button
                            onClick={onToggleBreak}
                            className={clsx(
                                "flex-1 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all active:scale-[0.96] flex items-center justify-center gap-2 border",
                                isBreak
                                    ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20"
                                    : "bg-slate-50 dark:bg-white/5 text-slate-500 border-slate-100 dark:border-white/10 hover:text-indigo-600"
                            )}
                        >
                            <Coffee size={14} className={isBreak ? "text-white" : "text-indigo-400"} />
                            <span>{isBreak ? "End" : "Break"}</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}