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
            "absolute bottom-12 left-1/2 -translate-x-1/2 transition-all duration-700 ease-in-out z-40",
            showSponsorCard ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        )}>
            {sponsors.length > 0 && (
                <div className="relative group">
                    {/* Glow effect */}
                    <div className="absolute -inset-1 bg-[#FF5A09]/20 blur-xl opacity-50 rounded-2xl" />
                    <div className="relative bg-black/90 text-white p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md flex items-center gap-6 pr-8">
                        {/* Sponsor Image Container */}
                        <div className="h-16 w-auto min-w-[80px] flex items-center justify-center rounded-lg overflow-hidden bg-white/5 p-2">
                            <img
                                src={sponsors[currentSponsorIndex]?.advertUrl}
                                alt="Sponsor"
                                className="h-full w-auto object-contain max-w-[120px]"
                            />
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-[#FF5A09] uppercase tracking-[0.2em] mb-0.5">Sponsored By</span>
                            <span className="text-xl font-black text-white leading-tight line-clamp-1">
                                {sponsors[currentSponsorIndex]?.name}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
