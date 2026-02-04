
import { Settings2, Wifi, Maximize, Minimize, Clock, Pause, Play } from 'lucide-react';
import clsx from 'clsx';

interface MatchTimerProps {
    elapsedDisplay: number;
    isTimerRunning: boolean;
    isCompleted: boolean;
    onToggleTimer: () => void;
    formatTime: (s: number) => string;
}

export default function MatchTimer({
    elapsedDisplay,
    isTimerRunning,
    isCompleted,
    onToggleTimer,
    formatTime
}: MatchTimerProps) {
    return (
        <div className="flex-1 bg-white dark:bg-[#252525] rounded-[2rem] border border-slate-100 dark:border-white/5 p-6 flex flex-col items-center justify-center shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 mb-4">
                <Clock size={16} />
                <span className="text-xs font-black uppercase tracking-widest">Match Duration</span>
            </div>
            <div className="text-6xl font-instrument font-medium text-slate-900 dark:text-white tabular-nums mb-6">
                {formatTime(elapsedDisplay)}
            </div>
            {!isCompleted && (
                <button
                    onClick={onToggleTimer}
                    className={clsx(
                        "px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3",
                        isTimerRunning
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A]"
                    )}
                >
                    {isTimerRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    {isTimerRunning ? "Pause Match" : "Start Match"}
                </button>
            )}
        </div>
    );
}
