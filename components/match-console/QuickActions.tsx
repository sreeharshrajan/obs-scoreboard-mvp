
import { ArrowRightLeft, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { memo } from 'react';

interface QuickActionsProps {
    onSwap: () => void;
    onEndMatch: () => void;

    isCompleted: boolean;
}

export default memo(function QuickActions({
    onSwap,
    onEndMatch,
    isCompleted,
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



        </>
    );
});
