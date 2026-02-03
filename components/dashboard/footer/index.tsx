import { ShieldCheck } from "lucide-react";

const DashboardFooter = () => (
    <footer className="h-auto md:h-14 py-4 md:py-0 px-6 md:px-10 border-t border-slate-100 dark:border-white/5 flex flex-col-reverse md:flex-row items-center justify-between bg-white dark:bg-[#1A1A1A] gap-4">

        {/* Left: Branding & Version */}
        <div className="flex items-center gap-4">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 dark:opacity-20">
                ScoreStreamer Pro
            </span>
            <span className="text-[9px] font-bold text-[#FF5A09]/60 uppercase tracking-widest">
                v1.0.0
            </span>
        </div>

        {/* Right: Status Indicator (Functional focus) */}
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    System Synced
                </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-slate-300 dark:text-white/10">
                <ShieldCheck size={12} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Secured</span>
            </div>
        </div>

    </footer>
);

export default DashboardFooter;