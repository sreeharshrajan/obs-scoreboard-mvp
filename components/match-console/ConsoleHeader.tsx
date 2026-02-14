import Image from "next/image";
import { Maximize, Minimize, ArrowLeft, Edit, LayoutTemplate, Palette } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { MatchState } from '@/types/match';
import { memo } from 'react';

interface ConsoleHeaderProps {
    matchId: string;
    tournamentId: string;
    tournamentName?: string;
    match: MatchState;
    onUpdateMatch: (updates: Partial<MatchState>) => void;
    isSyncing: boolean;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
}

export default memo(function ConsoleHeader({ matchId, tournamentId, tournamentName, match, onUpdateMatch, isSyncing, isFullscreen, onToggleFullscreen }: ConsoleHeaderProps) {

    return (
        <header className="relative z-50 flex items-center justify-between bg-white dark:bg-[#1E1E1E] border border-slate-200/60 dark:border-white/10 p-2 md:p-3 rounded-[24px] shadow-sm">
            {/* LEFT SECTION: Identity */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/tournaments/${tournamentId}`}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-500 transition-all hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-[#FF5A09] active:scale-95"
                >
                    <ArrowLeft size={22} strokeWidth={2.5} />
                </Link>

                {/* Larger Tournament Logo - Strategic Placement */}
                {match.tournamentLogo && (
                    <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/10 p-2 ring-1 ring-slate-200 dark:ring-white/5">
                        <Image
                            src={match.tournamentLogo}
                            alt="Tournament Logo"
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                    </div>
                )}

                <div className="flex flex-col">
                    <h2 className="text-[14px] font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-tight">
                        Match <span className="text-[#FF5A09]">Console</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={clsx(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            match.status === 'live' ? "bg-red-500 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400"
                        )}>
                            {match.status === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                            {match.status || 'Scheduled'}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-md">
                            {match.court || 'Court 1'}
                        </span>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION: Controls */}
            <div className="flex items-center gap-2">
                {/* Sync Indicator */}
                <div className="hidden lg:flex items-center gap-2.5 h-10 px-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                    <div className="relative flex h-2 w-2">
                        <span className={clsx("absolute inline-flex h-full w-full rounded-full opacity-75", isSyncing ? "bg-yellow-400 animate-ping" : "bg-green-500")} />
                        <span className={clsx("relative inline-flex h-2 w-2 rounded-full", isSyncing ? "bg-yellow-500" : "bg-green-500")} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {isSyncing ? "Syncing" : "Connected"}
                    </span>
                </div>

                {/* Action Group */}
                <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/50 dark:border-white/5">
                    <Link
                        href={`/overlay/matches/${matchId}`}
                        target="_blank"
                        title="View Public Overlay"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:text-[#FF5A09] transition-all font-bold text-xs uppercase tracking-wide active:scale-95 shadow-sm"
                    >
                        <LayoutTemplate size={16} />
                        <span className="hidden md:inline">View</span>
                    </Link>

                    <Link
                        href={`/tournaments/${tournamentId}/matches/${matchId}/overlay-editor`}
                        title="Customize Overlay Layout"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:text-[#FF5A09] transition-all font-bold text-xs uppercase tracking-wide active:scale-95 shadow-sm"
                    >
                        <Palette size={16} />
                        <span className="hidden md:inline">Design</span>
                    </Link>

                    <Link
                        title="Edit Match Info"
                        href={`/tournaments/${tournamentId}/matches/${matchId}/edit`}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:text-[#FF5A09] transition-all font-bold text-xs uppercase tracking-wide active:scale-95 shadow-sm"
                    >
                        <Edit size={16} />
                    </Link>
                </div>

                {/* Fullscreen Button */}
                <button
                    onClick={onToggleFullscreen}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-all active:scale-90 shadow-md"
                    title="Toggle Fullscreen"
                >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
            </div>
        </header>
    );
});