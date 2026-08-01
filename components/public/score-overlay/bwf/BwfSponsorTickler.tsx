import React from 'react';
import clsx from 'clsx';
import { MatchState } from "@/types/match";
import { getActiveSponsor, Sponsor } from '@/lib/matchHelpers';

interface BwfSponsorTicklerProps {
    sponsors: Sponsor[];
    currentSponsorIndex: number;
    match: MatchState;
}

export default function BwfSponsorTickler({ sponsors, currentSponsorIndex, match }: BwfSponsorTicklerProps) {
    const isBreak = match.status === 'break';
    const showSponsorCard = !isBreak && match.isSponsorsOverlayActive && sponsors.length > 0;
    const isLogoOnly = match.sponsorDisplayMode === 'logoOnly';

    const sizeClass = match.sponsorLogoSize === 'sm'
        ? "h-10 max-w-[140px]"
        : match.sponsorLogoSize === 'lg'
            ? "h-20 max-w-[280px]"
            : match.sponsorLogoSize === 'xl'
                ? "h-28 max-w-[360px]"
                : "h-14 max-w-[200px]"; // default 'md'

    const currentSponsor = getActiveSponsor(sponsors, currentSponsorIndex, true);

    return (
        <div className={clsx(
            "absolute top-12 right-12 transition-all duration-700 ease-in-out z-40 font-sans flex items-center justify-center",
            showSponsorCard ? "translate-y-0 opacity-100 scale-100 pointer-events-auto" : "-translate-y-24 opacity-0 scale-95 pointer-events-none"
        )}>
            {sponsors.length > 0 && (
                isLogoOnly ? (
                    <img
                        src={currentSponsor?.advertUrl}
                        alt={currentSponsor?.name || "Sponsor"}
                        className={clsx(
                            "w-auto object-contain transition-all duration-300 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]",
                            sizeClass
                        )}
                    />
                ) : (
                    <div className="bg-white/95 backdrop-blur-sm text-slate-900 p-3 pr-6 rounded-lg shadow-xl flex items-center gap-4 min-w-70 border border-slate-200">
                        {/* Sponsor Image Container */}
                        <div className="h-12 w-auto min-w-17.5 flex items-center justify-center bg-white rounded-md p-1.5 shadow-sm border border-slate-100">
                            <img
                                src={currentSponsor?.advertUrl}
                                alt="Sponsor"
                                className="h-full w-auto object-contain max-w-[100px]"
                            />
                        </div>

                        <div className="flex flex-col gap-0">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sponsored By</span>
                            <span className="text-base font-black text-slate-800 leading-tight tracking-tight line-clamp-1 uppercase">
                                {currentSponsor?.name}
                            </span>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
