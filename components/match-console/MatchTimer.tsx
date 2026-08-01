import { Clock, Pause, Play, Coffee, Info, MapPin, Hash, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { memo } from 'react';
import { MatchState, GameResult } from '@/types/match';

interface MatchTimerProps {
    matchDetails: MatchState;
    elapsedDisplay: number;
    isTimerRunning: boolean;
    isCompleted: boolean;
    isMatchWon?: boolean;
    onToggleTimer: () => void;
    formatTime: (s: number) => string;
    matchStatus: string;
    isBreak: boolean;
    onToggleBreak: () => void;
    currentGame?: number;
    totalGames?: number;
    gameHistory?: GameResult[];
    breakRemainingDisplay?: number;
    breakDuration?: number;
    onSelectBreakDuration?: (seconds: number) => void;
}

export default memo(function MatchTimer({
    matchDetails,
    elapsedDisplay,
    isTimerRunning,
    isCompleted,
    isMatchWon = false,
    onToggleTimer,
    formatTime,
    matchStatus,
    isBreak,
    onToggleBreak,
    currentGame = 1,
    totalGames = 3,
    gameHistory = [],
    breakRemainingDisplay = 60,
    breakDuration = 60,
    onSelectBreakDuration,
}: MatchTimerProps) {
    const isBreakOverTime = isBreak && breakRemainingDisplay < 0;

    return (
        <div className={clsx(
            "flex-1 rounded-2xl sm:rounded-3xl border transition-all duration-500 p-3 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-6 relative overflow-hidden",
            isBreak
                ? "bg-indigo-50/40 dark:bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                : "bg-white dark:bg-[#1E1E1E] border-slate-100 dark:border-white/5 shadow-xl"
        )}>

            {/* Header: Tournament Context */}
            <div className="w-full text-center space-y-2 sm:space-y-4 px-1 sm:px-2">
                <span className="block text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-orange-500 line-clamp-1 leading-normal">
                    {matchDetails.tournamentName || "Tournament Name"}
                </span>
                
                <div className="hidden sm:flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                    <div className="h-[1px] w-8 bg-current opacity-20" />
                    <Trophy size={14} />
                    <div className="h-[1px] w-8 bg-current opacity-20" />
                </div>

                {/* Game Indicator */}
                {totalGames > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            Game {currentGame > totalGames ? totalGames : currentGame} of {totalGames}
                        </span>
                    </div>
                )}

                {/* Set History Chips */}
                {gameHistory.length > 0 && (
                    <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap pt-0.5 sm:pt-1">
                        {gameHistory.map((g) => (
                            <span
                                key={g.gameNumber}
                                className="px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg bg-slate-100 dark:bg-white/5 text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 tabular-nums"
                            >
                                G{g.gameNumber} {g.player1Score}–{g.player2Score}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Match Metadata Grid (Shown only when completed) */}
            {isCompleted && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 py-2 w-full max-w-xs">
                    <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 capitalize truncate">
                            {matchDetails.court || "Court 1"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <Info size={12} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                            {matchDetails.matchType || "Singles"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Hash size={12} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                            {matchDetails.scoringType || "21x3"} pts
                        </span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <Clock size={12} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                            {matchDetails.roundType || "Knockout"}
                        </span>
                    </div>
                </div>
            )}

            {/* Main Timer Group */}
            <div className="flex flex-col items-center my-auto w-full">
                <div className={clsx(
                    "flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 px-2.5 sm:px-4 py-0.5 sm:py-1 rounded-full transition-colors",
                    isCompleted
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                        : isMatchWon
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold animate-pulse"
                        : isBreak
                        ? isBreakOverTime
                            ? "bg-red-500/20 text-red-500 font-bold animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                            : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold"
                        : isTimerRunning
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-slate-100 dark:bg-white/5 text-slate-500"
                )}>
                    {isCompleted || isMatchWon ? (
                        <Trophy size={12} className={clsx("sm:hidden", isCompleted ? "text-emerald-500" : "text-amber-500")} />
                    ) : isBreak ? (
                        <Coffee size={12} className="sm:hidden animate-pulse" />
                    ) : (
                        <Clock size={12} className={clsx("sm:hidden", isTimerRunning && "animate-pulse")} />
                    )}
                    {isCompleted || isMatchWon ? (
                        <Trophy size={14} className={clsx("hidden sm:block", isCompleted ? "text-emerald-500" : "text-amber-500")} />
                    ) : isBreak ? (
                        <Coffee size={14} className="hidden sm:block animate-pulse" />
                    ) : (
                        <Clock size={14} className={clsx("hidden sm:block", isTimerRunning && "animate-pulse")} />
                    )}
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">
                        {isCompleted
                            ? "Completed"
                            : isMatchWon
                            ? "Won (Pending)"
                            : isBreak
                            ? "Break"
                            : isTimerRunning
                            ? "Live"
                            : "Paused"}
                    </span>
                </div>

                {isBreak ? (
                    <div className="flex flex-col items-center">
                        {/* Match Clock (Displayed above Break Timer) */}
                        <div className="flex items-center gap-1.5 mb-1 px-3 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
                            <Clock size={11} className={clsx("text-slate-400", isTimerRunning && "animate-pulse text-emerald-500")} />
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 tabular-nums">
                                Match Clock: {formatTime(elapsedDisplay)} {isTimerRunning ? "" : "(Paused)"}
                            </span>
                        </div>

                        {/* Main Break Countdown */}
                        <div className={clsx(
                            "text-4xl sm:text-6xl font-bold tabular-nums tracking-tighter transition-all duration-500 mt-1",
                            isBreakOverTime
                                ? "text-red-500 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                                : "text-indigo-600 dark:text-indigo-400"
                        )}>
                            {formatTime(Math.max(0, breakRemainingDisplay))}
                        </div>
                        <span className={clsx(
                            "text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors",
                            isBreakOverTime ? "text-red-400 font-extrabold animate-pulse" : "text-slate-400"
                        )}>
                            {isBreakOverTime ? "Break Time Over" : "Break Countdown"}
                        </span>

                        {/* Break Presets */}
                        {onSelectBreakDuration && !isCompleted && (
                            <div className="flex items-center gap-1.5 mt-4">
                                {[60, 90, 120, 180].map((sec) => (
                                    <button
                                        type="button"
                                        key={sec}
                                        onClick={() => onSelectBreakDuration(sec)}
                                        className={clsx(
                                            "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all border",
                                            breakDuration === sec
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                                                : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                                        )}
                                    >
                                        {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className={clsx(
                            "text-4xl sm:text-6xl font-bold tabular-nums tracking-tighter transition-colors duration-300",
                            isTimerRunning ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-400"
                        )}>
                            {formatTime(elapsedDisplay)}
                        </div>
                        
                        {isCompleted ? (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                                Final Duration
                            </span>
                        ) : isMatchWon ? (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mt-1 animate-pulse">
                                Click &quot;Confirm &amp; End Match&quot; below to finalize
                            </span>
                        ) : null}
                    </>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 w-full max-w-[320px] mt-auto">
                {!isCompleted ? (
                    <>
                        <button
                            type="button"
                            onClick={onToggleTimer}
                            className={clsx(
                                "flex-[2] py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-[11px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg",
                                isTimerRunning
                                    ? "bg-red-500 text-white shadow-red-500/20"
                                    : "bg-orange-500 text-white shadow-orange-500/20"
                            )}
                        >
                            {isTimerRunning ? (
                                <Pause size={16} fill="currentColor" />
                            ) : (
                                <Play size={16} fill="currentColor" />
                            )}
                            {isTimerRunning ? "Pause Match" : "Start Match"}
                        </button>

                        <button
                            type="button"
                            onClick={onToggleBreak}
                            className={clsx(
                                "flex-1 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-[11px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 border",
                                isBreak
                                    ? "bg-indigo-600 text-white border-transparent"
                                    : "bg-transparent border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                            )}
                        >
                            <Coffee size={14} className="sm:hidden" />
                            <Coffee size={16} className="hidden sm:block" />
                            <span>{isBreak ? "Resume" : "Break"}</span>
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={onToggleTimer}
                        className={clsx(
                            "w-full py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-[11px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg border",
                            isTimerRunning
                                ? "bg-red-500 text-white shadow-red-500/20"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
                        )}
                    >
                        {isTimerRunning ? (
                            <>
                                <Pause size={16} fill="currentColor" />
                                <span>Stop Clock</span>
                            </>
                        ) : (
                            <>
                                <Play size={16} fill="currentColor" />
                                <span>Resume & Start Clock</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
});