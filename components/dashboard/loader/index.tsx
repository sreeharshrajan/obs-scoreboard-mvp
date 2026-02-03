const DashboardLoader = () => (
    <div className="h-screen w-full flex items-center justify-center bg-[#FDFDFD] dark:bg-[#1A1A1A]">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-6 h-6 border-2 border-[#FF5A09] border-t-transparent rounded-full shadow-lg shadow-[#FF5A09]/20" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF5A09] animate-pulse">Syncing Session</span>
        </div>
    </div>
);

export default DashboardLoader;