import React from 'react';
import clsx from 'clsx';
import { MatchState } from "@/types/match";

interface BwfSponsorTicklerProps {
    sponsors: { id: string, advertUrl: string, name: string }[];
    currentSponsorIndex: number;
    match: MatchState;
}

export default function BwfSponsorTickler({ sponsors, currentSponsorIndex, match }: BwfSponsorTicklerProps) {
    const isBreak = match.status === 'break';
    const showSponsorCard = !isBreak && match.isSponsorsOverlayActive && sponsors.length > 0;

    return (
        <div className={clsx(
            "absolute top-12 right-12 transition-all duration-700 ease-in-out z-40 font-sans",
            showSponsorCard ? "translate-y-0 opacity-100 scale-100" : "-translate-y-24 opacity-0 scale-95"
        )}>
            {sponsors.length > 0 && (
                <div className="bg-white/95 backdrop-blur-sm text-slate-900 p-3 pr-6 rounded-lg shadow-xl flex items-center gap-4 min-w-[280px] border border-slate-200">
                    {/* Sponsor Image Container */}
                    <div className="h-12 w-auto min-w-[70px] flex items-center justify-center bg-white rounded-md p-1.5 shadow-sm border border-slate-100">
                        <img
                            src={sponsors[currentSponsorIndex]?.advertUrl}
                            alt="Sponsor"
                            className="h-full w-auto object-contain max-w-[100px]"
                        />
                    </div>

                    <div className="flex flex-col gap-0">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sponsored By</span>
                        <span className="text-base font-black text-slate-800 leading-tight tracking-tight line-clamp-1 uppercase">
                            {sponsors[currentSponsorIndex]?.name}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
