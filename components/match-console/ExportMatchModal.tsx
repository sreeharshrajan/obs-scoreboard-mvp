'use client';

import React, { useMemo } from 'react';
import { X, FileText, FileSpreadsheet, FileJson, Download, Trophy, Clock, Coffee, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { MatchState } from '@/types/match';
import { buildExportData, exportMatchSummary } from '@/lib/matchExport';

interface ExportMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    match: MatchState | null;
}

export default function ExportMatchModal({
    isOpen,
    onClose,
    match,
}: ExportMatchModalProps) {
    const exportData = useMemo(() => {
        if (!match) return null;
        return buildExportData(match);
    }, [match]);

    if (!isOpen || !match || !exportData) return null;

    const p1 = exportData.players.player1;
    const p2 = exportData.players.player2;

    const p1Games = p1.gamesWon;
    const p2Games = p2.gamesWon;
    const isP1Winner = p1Games > p2Games;
    const isP2Winner = p2Games > p1Games;

    const pointEvents = exportData.timeline.filter(e => e.eventType === 'point');

    const handleExport = (format: 'csv' | 'txt' | 'json') => {
        exportMatchSummary(match, format);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl bg-white dark:bg-[#1E1E1E] rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Fixed Top Header */}
                <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FF5A09]/10 border border-[#FF5A09]/20 flex items-center justify-center text-[#FF5A09] shrink-0">
                            <Download size={20} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5A09]">
                                Match Export
                            </div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                Export Match Summary & Data
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-slate-200/60 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Main Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                    {/* Match Overview Card */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 space-y-4">
                        {/* Meta Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-200/60 dark:border-white/5 pb-3">
                            <span className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                {exportData.matchInfo.tournament}
                            </span>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
                                <span>{exportData.matchInfo.court}</span>
                                <span>•</span>
                                <span>{exportData.matchInfo.scoringType}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Clock size={13} />
                                    {exportData.matchInfo.totalDuration}
                                </span>
                            </div>
                        </div>

                        {/* Teams & Score Comparison */}
                        <div className="grid grid-cols-12 items-center gap-2 sm:gap-4 py-1">
                            {/* Team 1 */}
                            <div className="col-span-5 text-right space-y-0.5">
                                <p className={clsx(
                                    "text-sm sm:text-base font-black leading-snug break-words",
                                    isP1Winner ? "text-[#FF5A09]" : "text-slate-800 dark:text-white"
                                )}>
                                    {p1.name}
                                </p>
                                {p1.partner && (
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        &amp; {p1.partner}
                                    </p>
                                )}
                            </div>

                            {/* Score Badges */}
                            <div className="col-span-2 flex items-center justify-center gap-1.5 sm:gap-2">
                                <span className={clsx(
                                    "w-9 h-10 sm:w-11 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black tabular-nums shadow-sm border",
                                    isP1Winner
                                        ? "bg-[#FF5A09] text-white border-[#FF5A09]"
                                        : "bg-white dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
                                )}>
                                    {p1Games}
                                </span>
                                <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">VS</span>
                                <span className={clsx(
                                    "w-9 h-10 sm:w-11 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black tabular-nums shadow-sm border",
                                    isP2Winner
                                        ? "bg-[#FF5A09] text-white border-[#FF5A09]"
                                        : "bg-white dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
                                )}>
                                    {p2Games}
                                </span>
                            </div>

                            {/* Team 2 */}
                            <div className="col-span-5 text-left space-y-0.5">
                                <p className={clsx(
                                    "text-sm sm:text-base font-black leading-snug break-words",
                                    isP2Winner ? "text-[#FF5A09]" : "text-slate-800 dark:text-white"
                                )}>
                                    {p2.name}
                                </p>
                                {p2.partner && (
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        &amp; {p2.partner}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Winner Alert */}
                        {exportData.winner && (
                            <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                                <Trophy size={16} className="shrink-0" />
                                <span className="text-xs font-black uppercase tracking-wider">
                                    Winner: {exportData.winner}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Game-by-Game Results */}
                    {exportData.gameResults.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block px-1">
                                Game Breakdown
                            </span>
                            <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                                <table className="w-full text-xs sm:text-sm">
                                    <thead>
                                        <tr className="bg-slate-100/70 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                            <th className="text-left px-4 py-2.5">Game</th>
                                            <th className="text-center px-4 py-2.5 truncate max-w-[140px]">{p1.name}</th>
                                            <th className="text-center px-4 py-2.5 truncate max-w-[140px]">{p2.name}</th>
                                            <th className="text-right px-4 py-2.5">Winner</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {exportData.gameResults.map((g) => (
                                            <tr key={g.gameNumber} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                                <td className="px-4 py-3 font-bold text-slate-500">Game {g.gameNumber}</td>
                                                <td className={clsx(
                                                    "text-center px-4 py-3 font-black text-sm sm:text-base tabular-nums",
                                                    g.player1Score > g.player2Score ? "text-[#FF5A09]" : "text-slate-400"
                                                )}>
                                                    {g.player1Score}
                                                </td>
                                                <td className={clsx(
                                                    "text-center px-4 py-3 font-black text-sm sm:text-base tabular-nums",
                                                    g.player2Score > g.player1Score ? "text-[#FF5A09]" : "text-slate-400"
                                                )}>
                                                    {g.player2Score}
                                                </td>
                                                <td className="text-right px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                                                    {g.winner}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Timeline Preview */}
                    {pointEvents.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    Scoring Timeline Preview
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {pointEvents.length} points logged
                                </span>
                            </div>
                            <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-100/70 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                            <th className="text-left px-3 py-2">Match Time</th>
                                            <th className="text-left px-3 py-2">Scored By</th>
                                            <th className="text-center px-3 py-2">Rally Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {pointEvents.slice(-5).map((e, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                                <td className="px-3 py-2 font-mono text-slate-400 tabular-nums">{e.time}</td>
                                                <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{e.player}</td>
                                                <td className="text-center px-3 py-2 font-black text-slate-900 dark:text-white tabular-nums">{e.detail}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {pointEvents.length > 5 && (
                                    <div className="px-4 py-2 text-center text-[10px] font-bold text-slate-400 bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5">
                                        + {pointEvents.length - 5} earlier point events in full export files
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Break Info */}
                    {exportData.breakSummary.totalBreaks > 0 && (
                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs">
                            <Coffee size={18} className="text-indigo-500 shrink-0" />
                            <div>
                                <span className="font-black">
                                    {exportData.breakSummary.totalBreaks} Break{exportData.breakSummary.totalBreaks > 1 ? 's' : ''} Taken
                                </span>
                                <span className="ml-2 font-medium opacity-80">
                                    (Total Duration: {exportData.breakSummary.totalBreakDuration})
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Empty state notice */}
                    {pointEvents.length === 0 && exportData.gameResults.length === 0 && (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-xs font-bold text-amber-600 dark:text-amber-400">
                            No point events recorded yet. Start the match to log scores!
                        </div>
                    )}
                </div>

                {/* Fixed Bottom Action Footer */}
                <div className="shrink-0 p-5 sm:p-6 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-[#181818] space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Select Export Format
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                            Instant Browser Download
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => handleExport('txt')}
                            className="group flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer active:scale-95 shadow-sm"
                        >
                            <FileText size={18} className="text-blue-500 shrink-0" />
                            <div className="text-center sm:text-left leading-tight">
                                <span className="text-xs font-black text-slate-800 dark:text-white block">Summary</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">.TXT</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleExport('csv')}
                            className="group flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer active:scale-95 shadow-sm"
                        >
                            <FileSpreadsheet size={18} className="text-emerald-500 shrink-0" />
                            <div className="text-center sm:text-left leading-tight">
                                <span className="text-xs font-black text-slate-800 dark:text-white block">Timeline</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">.CSV</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleExport('json')}
                            className="group flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-violet-500 hover:bg-violet-500/5 transition-all cursor-pointer active:scale-95 shadow-sm"
                        >
                            <FileJson size={18} className="text-violet-500 shrink-0" />
                            <div className="text-center sm:text-left leading-tight">
                                <span className="text-xs font-black text-slate-800 dark:text-white block">Raw Data</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">.JSON</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
