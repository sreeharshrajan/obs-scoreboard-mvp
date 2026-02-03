import { GamepadDirectional, Radio, Layout, Zap, Trophy, ArrowUpRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="h-screen w-full relative flex flex-col bg-[#FDFDFD] text-[#1A1A1A] dark:bg-[#1A1A1A] dark:text-[#EAEAEA] transition-colors duration-500 overflow-hidden font-sans">

      {/* Sophisticated Background Accents */}
      <div className="absolute top-0 right-[-5%] w-[50%] h-[50%] bg-[#FF5A09]/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[50%] h-[50%] bg-[#be4f0c]/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Compact Navigation */}
      <nav className="relative z-50 w-full px-6 md:px-10 h-16 flex items-center justify-between border-b border-slate-100 dark:border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 rounded-full border border-[#FF5A09]/20 flex items-center justify-center bg-white dark:bg-[#393939] shadow-sm transition-all duration-500 group-hover:rotate-[360deg] group-hover:border-[#FF5A09]/50">
            <GamepadDirectional size={16} className="text-[#FF5A09]" />
          </div>
          <span className="font-bold tracking-widest text-[10px] md:text-xs font-instrument uppercase">
            Score<span className="text-[#FF5A09]">Streamer</span>
          </span>
        </div>
        <Link
          href="/signin"
          className="h-9 px-5 rounded-full flex items-center justify-center
    text-[10px] font-bold uppercase tracking-widest transition-all
    border border-slate-200 dark:border-white/10
    hover:border-[#FF5A09] hover:text-[#FF5A09]
    active:scale-95">
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col lg:grid lg:grid-cols-2 gap-8 items-center justify-center">

        {/* Left: Functional Content */}
        <div className="flex flex-col items-start text-left space-y-4">
          <h1 className="text-4xl md:text-6xl xl:text-7xl font-medium font-instrument tracking-tight leading-[0.95]">
            Badminton <br />
            <span className="italic font-light text-[#FF5A09]">Live Scoring.</span>
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base font-light leading-relaxed max-w-sm">
            Professional OBS overlays powered by Next.js Edge. Manage tournaments, track match states, and sync scores with zero latency.
          </p>

          <div className="flex gap-3 pt-2">
            <Link href="/signin" className="px-6 py-3 rounded-full bg-[#393939] dark:bg-white text-white dark:text-[#1A1A1A] font-bold text-[11px] uppercase tracking-wider transition-all hover:scale-[1.02] shadow-xl shadow-black/5">
              Launch Dashboard
            </Link>
            <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 dark:border-white/10 font-bold text-[11px] uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
              <Radio size={14} className="text-[#ec7f37] group-hover:animate-pulse" />
              Public Overlay
            </button>
          </div>
        </div>


        <div className="grid grid-cols-2 grid-rows-2 gap-3 w-full max-w-lg lg:h-[320px]">

          {/* Card 1: Real-Time Sync (Wide) */}
          <div className="col-span-2 row-span-1 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#2A2A2A]/40 p-5 flex flex-col justify-between group overflow-hidden relative transition-all duration-500 hover:border-[#FF5A09]/30">
            <div className="absolute inset-0 bg-[#FF5A09]/5 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500" />

            <div className="flex justify-between items-start relative z-10">
              <div className="w-9 h-9 rounded-xl bg-[#FF5A09]/10 flex items-center justify-center text-[#FF5A09] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <Zap size={18} fill="currentColor" />
              </div>
              <ArrowUpRight size={16} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-500" />
            </div>

            <div className="relative z-10">
              <h3 className="text-lg font-instrument font-medium leading-none mb-1.5 transition-colors duration-500 group-hover:text-[#FF5A09]">Real-Time Sync</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Instant state updates for scores via Firebase Edge.</p>
            </div>
          </div>

          {/* Card 2: Tournament Management */}
          <div className="col-span-1 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#2A2A2A]/40 p-5 flex flex-col justify-between group overflow-hidden relative transition-all duration-500 hover:border-[#ec7f37]/30">
            <div className="absolute inset-0 bg-[#ec7f37]/5 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500" />

            <div className="flex justify-between items-start relative z-10">
              <div className="w-9 h-9 rounded-xl bg-[#ec7f37]/10 flex items-center justify-center text-[#ec7f37] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <Trophy size={18} fill="currentColor" />
              </div>
              <ArrowUpRight size={14} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-500" />
            </div>

            <div className="relative z-10">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-1 transition-colors duration-500 group-hover:text-[#ec7f37]">Tournament</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Multi-match engine.</p>
            </div>
          </div>

          {/* Card 3: Secure Access */}
          <div className="col-span-1 rounded-2xl border border-slate-200 dark:border-white/5 bg-[#393939] dark:bg-white p-5 flex flex-col justify-between group overflow-hidden relative transition-all duration-500 hover:border-[#FF5A09]/30">
            <div className="absolute inset-0 bg-[#FF5A09]/10 dark:bg-[#FF5A09]/5 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500" />

            <div className="flex justify-between items-start relative z-10">
              <div className="w-9 h-9 rounded-xl bg-[#FF5A09]/20 flex items-center justify-center text-[#FF5A09] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <ShieldCheck size={18} />
              </div>
              <ArrowUpRight size={14} className="text-white/20 dark:text-black/10 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-500" />
            </div>

            <div className="relative z-10">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-1 text-white dark:text-[#1A1A1A] transition-colors duration-500 group-hover:text-[#FF5A09] dark:group-hover:text-[#be4f0c]">Security</h3>
              <p className="text-[10px] text-white/50 dark:text-slate-500 leading-tight">OAuth 2.0 & Admin Guard.</p>
            </div>
          </div>
        </div>

      </main>

      {/* Modern Compact Footer */}
      <footer className="relative z-10 h-14 px-6 md:px-10 flex justify-between items-center w-full border-t border-slate-100 dark:border-white/5 bg-white/30 dark:bg-transparent backdrop-blur-sm">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
          &copy; 2026 ScoreStreamer PRO • MVP v1.0
        </p>
        <div className="flex gap-6 text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-white/10">
          <span className="hover:text-[#FF5A09] cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-[#FF5A09] cursor-pointer transition-colors">Documentation</span>
        </div>
      </footer>
    </div>
  );
}