
import { Settings2, Wifi, Maximize, Minimize, ArrowLeft, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { MatchState } from '@/types/match';

interface ConsoleHeaderProps {
    match: MatchState;
    isSyncing: boolean;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    tournamentId: string;
    matchId: string;
}

export default function ConsoleHeader({ match, isSyncing, isFullscreen, onToggleFullscreen, tournamentId, matchId }: ConsoleHeaderProps) {
    return (
        <div className="flex items-center justify-between bg-white dark:bg-[#252525] border border-slate-100 dark:border-white/5 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
                <Link
                    href={`/tournaments/${tournamentId}`}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-[#FF5A09]/10 hover:text-[#FF5A09] flex items-center justify-center text-slate-400 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                        Match <span className="text-[#FF5A09]">Console</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className={clsx(
                            "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                            match.status === 'live' ? "bg-red-500/10 text-red-500" : "bg-slate-100 dark:bg-white/5 text-slate-400"
                        )}>
                            Status: {match.status || 'Scheduled'}
                        </span>
                        <span className="text-slate-300 dark:text-white/10">|</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Court {match.court || 'TBD'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Link
                    href={`/tournaments/${tournamentId}/matches/${matchId}/edit`}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-[#FF5A09] hover:bg-[#FF5A09]/10 transition-all active:scale-95 hidden md:flex"
                    title="Edit Match Details"
                >
                    <Settings2 size={18} />
                </Link>
                <Link
                    href={`/overlay/matches/${matchId}`}
                    target="_blank"
                    className="px-3 py-1.5 flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-400 hover:text-[#FF5A09] hover:bg-[#FF5A09]/10 transition-all active:scale-95 hidden md:flex"
                    title="Open Scoreboard Overlay"
                >
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Overlay</span>
                    <ExternalLink size={14} />
                </Link>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    {isSyncing ? <Wifi size={14} className="text-yellow-500 animate-pulse" /> : <Wifi size={14} className="text-green-500" />}
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {isSyncing ? "Syncing" : "Connected"}
                    </span>
                </div>
                <button
                    onClick={onToggleFullscreen}
                    className="p-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-all active:scale-95 shadow-lg"
                >
                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
            </div>
        </div>
    );
}
