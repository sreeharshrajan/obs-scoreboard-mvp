export function ActivityFeed() {
    return (
        <section className="flex-1 min-h-[180px] flex flex-col space-y-3">
            <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Recent Activity Feed
            </h2>
            <div className="flex-1 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/30 dark:bg-[#2A2A2A]/10 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 border-dashed">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
                    <div className="flex gap-1">
                        <div className="w-1 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" />
                        <div className="w-1 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    No active streams detected
                </p>
            </div>
        </section>
    );
}