import React from 'react';
import clsx from 'clsx';
import { MatchState } from "@/types/match";

interface ClassicSponsorTicklerProps {
    sponsors: { id: string, advertUrl: string, name: string }[];
    currentSponsorIndex: number;
    match: MatchState;
}

export default function ClassicSponsorTickler({ sponsors, currentSponsorIndex, match }: ClassicSponsorTicklerProps) {
    const isBreak = match.status === 'break';
    const showSponsorCard = !isBreak && match.isSponsorsOverlayActive && sponsors.length > 0;

    return (
        <div className={clsx(
            "absolute bottom-12 left-1/2 -translate-x-1/2 transition-all duration-700 ease-in-out z-40",
            showSponsorCard ? "translate-y-0 opacity-100 scale-100" : "translate-y-24 opacity-0 scale-95"
        )}>
            {sponsors.length > 0 && (
                <div className="bg-white text-slate-900 p-4 pr-8 rounded-2xl shadow-2xl border border-white/40 flex items-center gap-6 min-w-[340px]">
                    {/* Sponsor Image Container */}
                    <div className="h-16 w-auto min-w-[90px] flex items-center justify-center rounded-xl bg-slate-50 p-2 border border-slate-200 shadow-inner">
                        <img
                            src={sponsors[currentSponsorIndex]?.advertUrl}
                            alt="Sponsor"
                            className="h-full w-auto object-contain max-w-[140px]"
                        />
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Proudly Sponsored By</span>
                        <span className="text-xl font-black text-slate-900 leading-tight tracking-tight line-clamp-1">
                            {sponsors[currentSponsorIndex]?.name}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
