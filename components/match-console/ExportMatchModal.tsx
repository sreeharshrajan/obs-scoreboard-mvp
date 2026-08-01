'use client';

import React, { useMemo } from 'react';
import { X, FileText, FileSpreadsheet, FileJson, Download, Trophy, Clock, Swords, Coffee } from 'lucide-react';
import clsx from 'clsx';
import { MatchState } from '@/types/match';
import { buildExportData, exportMatchSummary, MatchExportData } from '@/lib/matchExport';
import { getGameStructure } from '@/lib/matchHelpers';

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

    const p1Name = exportData.players.player1.partner
        ? `${exportData.players.player1.name} & ${exportData.players.player1.partner}`
        : exportData.players.player1.name;
    const p2Name = exportData.players.player2.partner
        ? `${exportData.players.player2.name} & ${exportData.players.player2.partner}`
        : exportData.players.player2.name;

    const p1Games = exportData.players.player1.gamesWon;
    const p2Games = exportData.players.player2.gamesWon;
    const isP1Winner = p1Games > p2Games;
    const isP2Winner = p2Games > p1Games;

    const pointEvents = exportData.timeline.filter(e => e.eventType === 'point');

    const handleExport = (format: 'csv' | 'txt' | 'json') => {
        exportMatchSummary(match, format);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="shrink-0 p-6 sm:p-8 pb-0">
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer z-10"
                        title="Close"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-[#FF5A09]/10 border border-[#FF5A09]/20 flex items-center justify-center text-[#FF5A09] shrink-0">
                            <Download size={28} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5A09] mb-1">
                                Match Export
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                                Download Report
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-6 sm:pb-8 space-y-5">

                    {/* Match Result Card */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-4">

                        {/* Tournament & Duration */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {exportData.matchInfo.tournament}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                <Clock size={12} />
                                {exportData.matchInfo.totalDuration}
                            </div>
                        </div>

                        {/* Score Display */}
                        <div className="flex items-center justify-between gap-4">
                            <div className={clsx("flex-1 text-center", isP1Winner && "opacity-100", !isP1Winner && !isP2Winner && "opacity-100", isP2Winner && "opacity-60")}>
                                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{p1Name}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className={clsx(
                                    "text-3xl font-black tabular-nums",
                                    isP1Winner ? "text-[#FF5A09]" : "text-slate-400"
                                )}>{p1Games}</span>
                                <Swords size={16} className="text-slate-300 dark:text-white/20" />
                                <span className={clsx(
                                    "text-3xl font-black tabular-nums",
                                    isP2Winner ? "text-[#FF5A09]" : "text-slate-400"
                                )}>{p2Games}</span>
                            </div>
                            <div className={clsx("flex-1 text-center", isP2Winner && "opacity-100", !isP1Winner && !isP2Winner && "opacity-100", isP1Winner && "opacity-60")}>
                                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{p2Name}</p>
                            </div>
                        </div>

                        {/* Winner */}
                        {exportData.winner && (
                            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <Trophy size={14} className="text-amber-500" />
                                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    Winner: {exportData.winner}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Game-by-Game Results */}
                    {exportData.gameResults.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block px-1">
                                Game Results
                            </span>
                            <div className="rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                                            <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Game</th>
                                            <th className="text-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 truncate max-w-[100px]">{exportData.players.player1.name}</th>
                                            <th className="text-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 truncate max-w-[100px]">{exportData.players.player2.name}</th>
                                            <th className="text-right px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Winner</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {exportData.gameResults.map((g) => (
                                            <tr key={g.gameNumber} className="border-b border-slate-100 dark:border-white/5 last:border-b-0">
                                                <td className="px-4 py-3 text-xs font-bold text-slate-500">Game {g.gameNumber}</td>
                                                <td className={clsx(
                                                    "text-center px-4 py-3 font-black text-base tabular-nums",
                                                    g.player1Score > g.player2Score ? "text-[#FF5A09]" : "text-slate-400"
                                                )}>{g.player1Score}</td>
                                                <td className={clsx(
                                                    "text-center px-4 py-3 font-black text-base tabular-nums",
                                                    g.player2Score > g.player1Score ? "text-[#FF5A09]" : "text-slate-400"
                                                )}>{g.player2Score}</td>
                                                <td className="text-right px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[100px]">{g.winner}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Scoring Timeline Preview (last 5 events) */}
                    {pointEvents.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    Scoring Timeline
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {pointEvents.length} points recorded
                                </span>
                            </div>
                            <div className="rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                                            <th className="text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
                                            <th className="text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Player</th>
                                            <th className="text-center px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pointEvents.slice(-5).map((e, i) => (
                                            <tr key={i} className="border-b border-slate-100 dark:border-white/5 last:border-b-0">
                                                <td className="px-3 py-2 text-xs font-mono text-slate-500 tabular-nums">{e.time}</td>
                                                <td className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{e.player}</td>
                                                <td className="text-center px-3 py-2 text-xs font-black text-slate-900 dark:text-white tabular-nums">{e.detail}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {pointEvents.length > 5 && (
                                    <div className="px-4 py-2 text-center text-[10px] font-bold text-slate-400 bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5">
                                        + {pointEvents.length - 5} more events — download full timeline below
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Break Summary */}
                    {exportData.breakSummary.totalBreaks > 0 && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                            <Coffee size={18} className="text-indigo-500 shrink-0" />
                            <div>
                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                    {exportData.breakSummary.totalBreaks} break{exportData.breakSummary.totalBreaks > 1 ? 's' : ''} taken
                                </span>
                                <span className="text-[10px] text-slate-400 ml-2">
                                    Total: {exportData.breakSummary.totalBreakDuration}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Export Buttons */}
                    <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block px-1">
                            Download Format
                        </span>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => handleExport('txt')}
                                className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#FF5A09]/40 hover:bg-[#FF5A09]/5 transition-all cursor-pointer active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                    <FileText size={20} className="text-blue-500" />
                                </div>
                                <div className="text-center">
                                    <span className="text-[11px] font-black text-slate-700 dark:text-white block">Summary</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">.TXT</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleExport('csv')}
                                className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#FF5A09]/40 hover:bg-[#FF5A09]/5 transition-all cursor-pointer active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                    <FileSpreadsheet size={20} className="text-emerald-500" />
                                </div>
                                <div className="text-center">
                                    <span className="text-[11px] font-black text-slate-700 dark:text-white block">Timeline</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">.CSV</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleExport('json')}
                                className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#FF5A09]/40 hover:bg-[#FF5A09]/5 transition-all cursor-pointer active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                                    <FileJson size={20} className="text-violet-500" />
                                </div>
                                <div className="text-center">
                                    <span className="text-[11px] font-black text-slate-700 dark:text-white block">Raw Data</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">.JSON</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* No data notice */}
                    {pointEvents.length === 0 && exportData.gameResults.length === 0 && (
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center">
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                No scoring data recorded yet. Start playing to generate export data!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
