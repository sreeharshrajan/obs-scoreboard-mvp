import React from 'react';
import clsx from 'clsx';
import { MatchState } from "@/types/match";

interface SponsorBreakDisplayProps {
    sponsors: { id: string, advertUrl: string, name: string }[];
    currentSponsorIndex: number;
    match: MatchState;
}

export default function SponsorBreakDisplay({ sponsors, currentSponsorIndex, match }: SponsorBreakDisplayProps) {
    const isBreak = match.status === 'break';
    const showFullPageAd = isBreak && sponsors.length > 0;

    return (
        <div className={clsx(
            "absolute inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-1000",
            showFullPageAd ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
            {sponsors.length > 0 && (
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Background Blur */}
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={sponsors[currentSponsorIndex]?.advertUrl}
                            alt="Background"
                            className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
                        />
                    </div>

                    {/* Main Image */}
                    <div className="relative z-10 max-w-[90%] max-h-[90%] flex flex-col items-center gap-8">
                        <img
                            src={sponsors[currentSponsorIndex]?.advertUrl}
                            alt={sponsors[currentSponsorIndex]?.name}
                            className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-sm"
                        />
                    </div>

                    {/* Break Indicator Pill */}
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-xl border border-white/20 px-10 py-4 rounded-full flex items-center gap-4 shadow-2xl">
                        <div className="w-3 h-3 rounded-full bg-[#FF5A09] animate-pulse shadow-[0_0_12px_#FF5A09]" />
                        <span className="text-white font-black uppercase tracking-[0.4em] text-lg">
                            {match.status === 'break' ? "Match Break" : "Ad Break"}
                        </span>
                    </div>

                    {/* Progress Indicator (Optional but looks cool) */}
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF5A09] transition-all duration-1000 ease-linear" style={{ width: '45%' }} />
                    </div>
                </div>
            )}
        </div>
    );
}

