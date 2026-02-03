"use client";
import { GamepadDirectional, LogOut, User, Activity, Menu } from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { auth } from "@/lib/firebase/client";

const DashboardHeader = () => {
    const { user } = useAuthStore();

    return (
        <header className="h-16 md:h-20 px-4 md:px-8 border-b border-slate-100 dark:border-white/5 backdrop-blur-xl bg-white/80 dark:bg-[#1A1A1A]/80 flex items-center justify-between sticky top-0 z-50">

            {/* Left: Branding */}
            <div className="flex items-center gap-3 md:gap-4 group cursor-pointer">
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl border border-[#FF5A09]/20 flex items-center justify-center bg-white dark:bg-[#252525] shadow-sm transition-all duration-300 group-hover:rotate-6 group-hover:shadow-[#FF5A09]/10 group-hover:shadow-lg">
                    <GamepadDirectional size={18} className="text-[#FF5A09] md:w-5 md:h-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.2em] leading-tight">
                        Score<span className="text-[#FF5A09]">Streamer</span>
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Console
                        </span>
                    </div>
                </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-2 md:gap-6">

                {/* Profile Chip - Hidden on mobile, standard text sizes */}
                <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 transition-colors hover:bg-slate-100 dark:hover:bg-white/10">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-[#FF5A09]/10 flex items-center justify-center">
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt="User avatar"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <User size={12} className="text-[#FF5A09]" />
                        )}
                    </div>

                    <div className="flex flex-col max-w-[100px] md:max-w-[140px]">
                        <span className="text-xs font-semibold truncate leading-none">
                            {user?.displayName || user?.email?.split("@")[0] || "User"}
                        </span>

                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Admin</span>
                    </div>
                </div>

                {/* Logout Button - Optimized Touch Target */}
                <button
                    onClick={() => auth.signOut()}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#FF5A09] hover:bg-[#FF5A09]/5 active:scale-95 transition-all group"
                    aria-label="Log Out"
                >
                    <span className="text-xs font-bold uppercase tracking-widest hidden md:block">Log Out</span>
                    <LogOut size={18} className="md:w-5 md:h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Mobile Menu Trigger (Optional visual placeholder for UX) */}
                <button className="p-2 md:hidden text-slate-400">
                    <Menu size={20} />
                </button>
            </div>
        </header>
    );
};

export default DashboardHeader;