"use client";
import { useState } from "react";
import { GamepadDirectional, LogOut, User, Menu, X, Trophy, Users } from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { auth } from "@/lib/firebase/client";
import { resolveRoles } from "@/lib/auth/roles"; 
import Link from "next/link";

const DashboardHeader = () => {
    const { user } = useAuthStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // Check admin status
    const { isAdmin } = resolveRoles(user?.email || null);

    const navLinks = [
        { name: "Tournaments", href: "/tournaments", icon: Trophy, public: true },
        { name: "Users", href: "/users", icon: Users, public: false }, 
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <>
            <header className="h-16 md:h-20 px-4 md:px-8 border-b border-slate-100 dark:border-white/5 backdrop-blur-xl bg-white/80 dark:bg-[#1A1A1A]/80 flex items-center justify-between sticky top-0 z-50">
                
                {/* Left: Branding */}
                <Link href='/dashboard' className="flex items-center gap-3 md:gap-4 group cursor-pointer">
                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl border border-[#FF5A09]/20 flex items-center justify-center bg-white dark:bg-[#252525] shadow-sm transition-all duration-300 group-hover:rotate-6 group-hover:shadow-[#FF5A09]/10 group-hover:shadow-lg">
                        <GamepadDirectional size={18} className="text-[#FF5A09] md:w-5 md:h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.2em] leading-tight">
                            Score<span className="text-[#FF5A09]">Streamer</span>
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6 mx-8">
                    {navLinks.map((link) => (
                        (link.public || isAdmin) && (
                            <Link 
                                key={link.href} 
                                href={link.href}
                                className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-[#FF5A09] transition-colors"
                            >
                                {link.name}
                            </Link>
                        )
                    ))}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Profile Chip */}
                    <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-[#FF5A09]/10 flex items-center justify-center">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={12} className="text-[#FF5A09]" />
                            )}
                        </div>
                        <div className="flex flex-col max-w-[100px]">
                            <span className="text-xs font-semibold truncate leading-none">
                                {user?.displayName || "User"}
                            </span>
                            {isAdmin && <span className="text-[8px] font-bold text-[#FF5A09] uppercase mt-1">Admin</span>}
                        </div>
                    </div>

                    <button
                        onClick={() => auth.signOut()}
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:text-[#FF5A09] transition-all"
                    >
                        <LogOut size={18} />
                    </button>

                    {/* Mobile Menu Trigger */}
                    <button 
                        onClick={toggleMenu}
                        className="p-2 md:hidden text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={toggleMenu} />
                    
                    <nav className="fixed top-16 left-0 right-0 bg-white dark:bg-[#1A1A1A] border-b border-slate-100 dark:border-white/5 p-4 flex flex-col gap-2 shadow-xl animate-in slide-in-from-top duration-200">
                        {navLinks.map((link) => (
                            (link.public || isAdmin) && (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={toggleMenu}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-sm font-bold uppercase tracking-widest transition-colors"
                                >
                                    <link.icon size={18} className="text-[#FF5A09]" />
                                    {link.name}
                                </Link>
                            )
                        ))}
                        <hr className="my-2 border-slate-100 dark:border-white/5" />
                        <button
                            onClick={() => auth.signOut()}
                            className="flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-bold uppercase tracking-widest transition-colors"
                        >
                            <LogOut size={18} />
                            Log Out
                        </button>
                    </nav>
                </div>
            )}
        </>
    );
};

export default DashboardHeader;