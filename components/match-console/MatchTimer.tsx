import { Clock, Pause, Play, Coffee, Info, MapPin, Hash, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { memo } from 'react';
import { MatchState } from '@/types/match';

interface MatchTimerProps {
    matchDetails: MatchState;
    elapsedDisplay: number;
    isTimerRunning: boolean;
    isCompleted: boolean;
    onToggleTimer: () => void;
    formatTime: (s: number) => string;
    matchStatus: string;
    isBreak: boolean;
    onToggleBreak: () => void;
}

export default memo(function MatchTimer({
    matchDetails,
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
            "flex-1 rounded-3xl border transition-all duration-500 p-6 max-h-[280px] flex flex-col items-center justify-between relative overflow-hidden",
            isBreak
                ? "bg-indigo-50/40 dark:bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                : "bg-white dark:bg-[#1E1E1E] border-slate-100 dark:border-white/5 shadow-xl"
        )}>

            {/* Header: Tournament Context */}
            <div className="w-full text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500">
                    {matchDetails.tournamentName || "Tournament Name"}
                </span>
                <div className="flex items-center justify-center gap-2 mt-1 text-slate-400 dark:text-slate-500">
                    <div className="h-[1px] w-8 bg-current opacity-20" />
                    <Trophy size={14} />
                    <div className="h-[1px] w-8 bg-current opacity-20" />
                </div>
            </div>

            {/* Match Metadata Grid */}
            {isCompleted && (
                < div className="grid grid-cols-2 gap-x-8 gap-y-2 my-4">
                    <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 capitalize">
                            {matchDetails.court || "Court 1"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-right justify-end">
                        <Info size={12} className="text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {matchDetails.matchType || "Singles"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Hash size={12} className="text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {matchDetails.scoringType || "21x3"} pts
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-right justify-end">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {matchDetails.roundType || "Knockout"}
                        </span>
                    </div>
                </div>
            )}

            {/* Main Timer Group */}
            < div className="flex flex-col items-center" >
                <div className={clsx(
                    "flex items-center gap-2 mb-1 px-4 py-1 rounded-full transition-colors mb-2",
                    isTimerRunning ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 dark:bg-white/5 text-slate-500"
                )}>
                    <Clock size={14} className={clsx(isTimerRunning && "animate-pulse")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {isBreak ? "Break Time" : "Match Clock"}
                    </span>
                </div>

                <div className={clsx(
                    "text-6xl font-bold tabular-nums tracking-tighter transition-all duration-300",
                    isTimerRunning ? "text-slate-900 dark:text-white scale-110" : "text-slate-300 dark:text-slate-600"
                )}>
                    {formatTime(elapsedDisplay)}
                </div>
            </div >

            {/* Action Buttons */}
            {!isCompleted && (
                <div className="flex gap-3 w-full max-w-[320px] mt-6">
                    <button
                        onClick={onToggleTimer}
                        className={clsx(
                            "flex-[2] py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg",
                            isTimerRunning
                                ? "bg-red-500 text-white shadow-red-500/20"
                                : "bg-orange-500 text-white shadow-orange-500/20"
                        )}
                    >
                        {isTimerRunning ? (
                            <Pause size={16} fill="white" />
                        ) : (
                            <Play size={16} fill="white" />
                        )}
                        {isTimerRunning ? "Pause Match" : "Start Match"}
                    </button>

                    <button
                        onClick={onToggleBreak}
                        className={clsx(
                            "flex-1 py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 border",
                            isBreak
                                ? "bg-indigo-600 text-white border-transparent"
                                : "bg-transparent border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                        )}
                    >
                        <Coffee size={16} />
                        <span>{isBreak ? "Resume" : "Break"}</span>
                    </button>
                </div>
            )}
        </div >
    );
});