
import { ArrowRightLeft, Trophy, ZoomIn, ZoomOut } from 'lucide-react';
import clsx from 'clsx';

interface QuickActionsProps {
    onSwap: () => void;
    onEndMatch: () => void;
    overlayScale: number;
    onScaleChange: (val: number) => void;
    isCompleted: boolean;
    onToggleSponsors: () => void;
    isSponsorsActive: boolean;
}

export default function QuickActions({
    onSwap,
    onEndMatch,
    overlayScale,
    onScaleChange,
    isCompleted,
    onToggleSponsors,
    isSponsorsActive
}: QuickActionsProps) {
    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={onSwap}
                    disabled={isCompleted}
                    className="flex flex-col items-center justify-center gap-2 p-6 rounded-[2rem] bg-white dark:bg-[#252525] border border-slate-100 dark:border-white/5 hover:border-[#FF5A09]/30 transition-all group disabled:opacity-50 disabled:hover:border-slate-100 dark:disabled:hover:border-white/5 disabled:cursor-not-allowed"
                >
                    <ArrowRightLeft size={20} className="text-slate-400 group-hover:text-[#FF5A09] transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Swap Sides</span>
                </button>
                <button
                    onClick={onEndMatch}
                    disabled={isCompleted}
                    className="flex flex-col items-center justify-center gap-2 p-6 rounded-[2rem] bg-white dark:bg-[#252525] border border-slate-100 dark:border-white/5 hover:border-red-500/30 transition-all group disabled:opacity-50"
                    title="End Match"
                >
                    <Trophy size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">End Match</span>
                </button>
            </div>

            <button
                onClick={onToggleSponsors}
                className={clsx(
                    "flex items-center justify-between p-6 rounded-[2rem] border transition-all group w-full",
                    isSponsorsActive
                        ? "bg-[#FF5A09] border-[#FF5A09] text-white shadow-xl shadow-[#FF5A09]/20"
                        : "bg-white dark:bg-[#252525] border-slate-100 dark:border-white/5 hover:border-[#FF5A09]/30"
                )}
            >
                <div className="flex flex-col items-start gap-1">
                    <span className={clsx("text-sm font-black uppercase tracking-tight", isSponsorsActive ? "text-white" : "text-slate-900 dark:text-white")}>
                        Sponsors Overlay
                    </span>
                    <span className={clsx("text-[10px] font-bold uppercase tracking-widest", isSponsorsActive ? "text-white/80" : "text-slate-400")}>
                        {isSponsorsActive ? "Active on Stream" : "Hidden"}
                    </span>
                </div>
                <div className={clsx("w-10 h-6 rounded-full p-1 transition-colors flex items-center", isSponsorsActive ? "bg-white/20 justify-end" : "bg-slate-100 dark:bg-white/10 justify-start")}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
            </button>

            <div className="bg-slate-900 dark:bg-white p-6 rounded-[2rem] flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-white/40 dark:text-black/40 uppercase tracking-widest">Overlay Zoom</span>
                    <span className="text-xs font-bold text-[#FF5A09]">{Math.round(overlayScale * 100)}%</span>
                </div>
                {/* Custom Range Input Style in globals.css recommended, but using standard here */}
                <div className="flex items-center gap-2">
                    <ZoomOut size={12} className="text-white/20 dark:text-black/20" />
                    <input
                        type="range"
                        min="0.5" max="1.5" step="0.05"
                        value={overlayScale}
                        onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 dark:bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#FF5A09]"
                    />
                    <ZoomIn size={12} className="text-white/20 dark:text-black/20" />
                </div>
            </div>
        </>
    );
}
