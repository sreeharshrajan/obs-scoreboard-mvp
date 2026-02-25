import React from 'react';
import clsx from 'clsx';
import { MatchState } from "@/types/match";

interface SponsorTicklerProps {
    sponsors: { id: string, advertUrl: string, name: string }[];
    currentSponsorIndex: number;
    match: MatchState;
}

export default function SponsorTickler({ sponsors, currentSponsorIndex, match }: SponsorTicklerProps) {
    const isBreak = match.status === 'break';
    const showSponsorCard = !isBreak && match.isSponsorsOverlayActive && sponsors.length > 0;

    return (
        <div className={clsx(
            "absolute bottom-16 left-1/2 -translate-x-1/2 transition-all duration-1000 ease-in-out z-40",
            showSponsorCard ? "translate-y-0 opacity-100 scale-100" : "translate-y-32 opacity-0 scale-90"
        )}>
            {sponsors.length > 0 && (
                <div className="relative group">
                    {/* Animated Glow effect */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#FF5A09]/30 to-orange-400/30 blur-2xl opacity-50 rounded-3xl animate-pulse" />

                    <div className="relative bg-black/90 text-white p-6 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-2xl flex items-center gap-8 pr-12 min-w-[400px]">
                        {/* Sponsor Image Container */}
                        <div className="h-24 w-auto min-w-[120px] flex items-center justify-center rounded-xl overflow-hidden bg-white/5 p-4 border border-white/5 shadow-inner">
                            <img
                                src={sponsors[currentSponsorIndex]?.advertUrl}
                                alt="Sponsor"
                                className="h-full w-auto object-contain max-w-[180px]"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-black text-[#FF5A09] uppercase tracking-[0.3em] mb-1">Proudly Sponsored By</span>
                            <span className="text-3xl font-black text-white leading-tight tracking-tight line-clamp-1 drop-shadow-sm">
                                {sponsors[currentSponsorIndex]?.name}
                            </span>
                        </div>

                        {/* Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF5A09]/10 to-transparent rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                    </div>
                </div>
            )}
        </div>
    );
}

