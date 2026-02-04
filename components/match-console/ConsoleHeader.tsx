
import { Wifi, Maximize, Minimize, ArrowLeft, ExternalLink, Settings, Monitor, Image as ImageIcon, Users, Edit, ZoomIn, ZoomOut, Info } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { MatchState } from '@/types/match';
import { useState, useRef, useEffect } from 'react';

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

export default function ConsoleHeader({ matchId, tournamentId, tournamentName, match, onUpdateMatch, isSyncing, isFullscreen, onToggleFullscreen }: ConsoleHeaderProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleSetting = (key: keyof MatchState) => {
        // If undefined, treat as true (default visible) -> so toggle becomes false.
        // OR define strict defaults. Let's assume undefined = true for logos, false for sponsors.
        let currentVal: boolean;
        if (key === 'isSponsorsOverlayActive') {
            currentVal = !!match.isSponsorsOverlayActive;
        } else {
            // For logos, default to true if undefined
            currentVal = match[key] !== false;
        }
        onUpdateMatch({ [key]: !currentVal });
    };

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
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    {isSyncing ? <Wifi size={14} className="text-yellow-500 animate-pulse" /> : <Wifi size={14} className="text-green-500" />}
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {isSyncing ? "Syncing" : "Connected"}
                    </span>
                </div>
                <Link
                    href={`/overlay/matches/${matchId}`}
                    target="_blank"
                    className="px-3 py-1.5 flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-400 hover:text-[#FF5A09] hover:bg-[#FF5A09]/10 transition-all active:scale-95 hidden md:flex"
                    title="Open Scoreboard Overlay"
                >
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Overlay</span>
                    <ExternalLink size={14} />
                </Link>
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={clsx("p-2.5 rounded-xl transition-colors", isSettingsOpen ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white" : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400")}
                    >
                        <Settings size={18} />
                    </button>

                    {isSettingsOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5 mb-1">
                                Overlay Settings
                            </div>
                            <div className="flex flex-col gap-1">
                                {/* Sponsors Toggle */}
                                <button
                                    onClick={() => toggleSetting('isSponsorsOverlayActive')}
                                    className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Monitor size={16} className={match.isSponsorsOverlayActive ? "text-[#FF5A09]" : "text-slate-400"} />
                                        <span className={clsx("text-sm font-medium", match.isSponsorsOverlayActive ? "text-slate-900 dark:text-white" : "text-slate-500")}>Sponsors Overlay</span>
                                    </div>
                                    <div className={clsx("w-8 h-4 rounded-full p-0.5 transition-colors", match.isSponsorsOverlayActive ? "bg-[#FF5A09]" : "bg-slate-200 dark:bg-white/10")}>
                                        <div className={clsx("w-3 h-3 bg-white rounded-full shadow-sm transition-transform", match.isSponsorsOverlayActive ? "translate-x-4" : "translate-x-0")} />
                                    </div>
                                </button>

                                {/* Tournament Logo Toggle */}
                                <button
                                    onClick={() => toggleSetting('showTournamentLogo')}
                                    className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <ImageIcon size={16} className={match.showTournamentLogo !== false ? "text-[#FF5A09]" : "text-slate-400"} />
                                        <span className={clsx("text-sm font-medium", match.showTournamentLogo !== false ? "text-slate-900 dark:text-white" : "text-slate-500")}>Tournament Logo</span>
                                    </div>
                                    <div className={clsx("w-8 h-4 rounded-full p-0.5 transition-colors", match.showTournamentLogo !== false ? "bg-[#FF5A09]" : "bg-slate-200 dark:bg-white/10")}>
                                        <div className={clsx("w-3 h-3 bg-white rounded-full shadow-sm transition-transform", match.showTournamentLogo !== false ? "translate-x-4" : "translate-x-0")} />
                                    </div>
                                </button>

                                {/* Streamer Logo Toggle */}
                                <button
                                    onClick={() => toggleSetting('showStreamerLogo')}
                                    className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Users size={16} className={match.showStreamerLogo !== false ? "text-[#FF5A09]" : "text-slate-400"} />
                                        <span className={clsx("text-sm font-medium", match.showStreamerLogo !== false ? "text-slate-900 dark:text-white" : "text-slate-500")}>Streamer Logo</span>
                                    </div>
                                    <div className={clsx("w-8 h-4 rounded-full p-0.5 transition-colors", match.showStreamerLogo !== false ? "bg-[#FF5A09]" : "bg-slate-200 dark:bg-white/10")}>
                                        <div className={clsx("w-3 h-3 bg-white rounded-full shadow-sm transition-transform", match.showStreamerLogo !== false ? "translate-x-4" : "translate-x-0")} />
                                    </div>
                                </button>

                                {/* Match Info Toggle */}
                                <button
                                    onClick={() => toggleSetting('showMatchInfo')}
                                    className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Info size={16} className={match.showMatchInfo !== false ? "text-[#FF5A09]" : "text-slate-400"} />
                                        <span className={clsx("text-sm font-medium", match.showMatchInfo !== false ? "text-slate-900 dark:text-white" : "text-slate-500")}>Match Info</span>
                                    </div>
                                    <div className={clsx("w-8 h-4 rounded-full p-0.5 transition-colors", match.showMatchInfo !== false ? "bg-[#FF5A09]" : "bg-slate-200 dark:bg-white/10")}>
                                        <div className={clsx("w-3 h-3 bg-white rounded-full shadow-sm transition-transform", match.showMatchInfo !== false ? "translate-x-4" : "translate-x-0")} />
                                    </div>
                                </button>

                                {/* Overlay Zoom Slider */}
                                <div className="px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Overlay Zoom</span>
                                        <span className="text-xs font-bold text-[#FF5A09]">{Math.round((match.overlayScale || 1) * 100)}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ZoomOut size={12} className="text-slate-400" />
                                        <input
                                            type="range"
                                            min="0.5" max="1.5" step="0.05"
                                            value={match.overlayScale || 1}
                                            onChange={(e) => onUpdateMatch({ overlayScale: parseFloat(e.target.value) })}
                                            className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF5A09]"
                                        />
                                        <ZoomIn size={12} className="text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <Link
                    href={`/tournaments/${tournamentId}/matches/${matchId}/edit`}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-[#FF5A09] hover:bg-[#FF5A09]/10 transition-all active:scale-95 hidden md:flex"
                    title="Edit Match Details"
                >
                    <Edit size={18} />
                </Link>


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
