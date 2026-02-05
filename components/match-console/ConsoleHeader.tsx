import Image from "next/image";
import { Wifi, Maximize, Minimize, ArrowLeft, ExternalLink, Settings, Monitor, Image as ImageIcon, Users, Edit, ZoomIn, ZoomOut, Info, LayoutTemplate } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { MatchState } from '@/types/match';
import { useState, useRef, useEffect, memo } from 'react';

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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleSetting = (key: keyof MatchState) => {
        const currentVal = key === 'isSponsorsOverlayActive' ? !!match.isSponsorsOverlayActive : match[key] !== false;
        onUpdateMatch({ [key]: !currentVal });
    };

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
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:text-[#FF5A09] transition-all font-bold text-xs uppercase tracking-wide active:scale-95 shadow-sm"
                    >
                        <LayoutTemplate size={16} />
                        <span className="hidden md:inline">Overlay</span>
                    </Link>

                    <Link
                        title="Edit Match Info"
                        href={`/tournaments/${tournamentId}/matches/${matchId}/edit`}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:text-[#FF5A09] transition-all font-bold text-xs uppercase tracking-wide active:scale-95 shadow-sm"
                    >
                        <Edit size={16} />
                    </Link>
                </div>

                {/* Settings Toggle */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={clsx(
                            "flex h-10 px-4 items-center gap-2 rounded-xl transition-all font-bold text-xs uppercase tracking-wide active:scale-95",
                            isSettingsOpen
                                ? "bg-[#FF5A09] text-white shadow-lg shadow-orange-500/30"
                                : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        <Settings size={18} className={isSettingsOpen ? "animate-spin-slow" : ""} />
                        <span className="hidden sm:inline">Settings</span>
                    </button>

                    {/* Dropdown Menu (Improved Contrast) */}
                    {isSettingsOpen && (
                        <div className="absolute top-full right-0 mt-3 w-72 origin-top-right overflow-hidden bg-white dark:bg-[#1A1A1A] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-white/10 p-2 z-[60] animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 mb-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Graphics Configuration</p>
                            </div>

                            <div className="space-y-0.5">
                                <ToggleItem icon={<Monitor size={16} />} label="Sponsor Cards" active={!!match.isSponsorsOverlayActive} onClick={() => toggleSetting('isSponsorsOverlayActive')} />
                                <ToggleItem icon={<ImageIcon size={16} />} label="Tournament Logo" active={match.showTournamentLogo !== false} onClick={() => toggleSetting('showTournamentLogo')} />
                                <ToggleItem icon={<Users size={16} />} label="Streamer Branding" active={match.showStreamerLogo !== false} onClick={() => toggleSetting('showStreamerLogo')} />
                                <ToggleItem icon={<Info size={16} />} label="Match Details" active={match.showMatchInfo !== false} onClick={() => toggleSetting('showMatchInfo')} />

                                <div className="mx-2 mt-4 mb-2 p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overlay Zoom</span>
                                        <span className="text-xs font-black text-[#FF5A09] px-2 py-0.5 bg-orange-500/10 rounded-lg">{Math.round((match.overlayScale || 1) * 100)}%</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ZoomOut size={14} className="text-slate-400" />
                                        <input
                                            type="range" min="0.5" max="1.5" step="0.05"
                                            value={match.overlayScale || 1}
                                            onChange={(e) => onUpdateMatch({ overlayScale: parseFloat(e.target.value) })}
                                            className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-[#FF5A09]"
                                        />
                                        <ZoomIn size={14} className="text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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

function ToggleItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex w-full items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
        >
            <div className="flex items-center gap-3">
                <div className={clsx("transition-colors", active ? "text-[#FF5A09]" : "text-slate-400")}>
                    {icon}
                </div>
                <span className={clsx("text-[13px] font-bold transition-colors", active ? "text-slate-900 dark:text-white" : "text-slate-500")}>
                    {label}
                </span>
            </div>
            <div className={clsx(
                "w-8 h-4 rounded-full p-0.5 transition-all duration-300",
                active ? "bg-[#FF5A09]" : "bg-slate-200 dark:bg-white/10"
            )}>
                <div className={clsx(
                    "w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm",
                    active ? "translate-x-4" : "translate-x-0"
                )} />
            </div>
        </button>
    );
}