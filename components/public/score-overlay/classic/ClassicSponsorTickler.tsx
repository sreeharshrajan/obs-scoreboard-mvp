import React from 'react';
import clsx from 'clsx';
import { MatchState } from "@/types/match";
import { getActiveSponsor, Sponsor } from '@/lib/matchHelpers';

interface ClassicSponsorTicklerProps {
    sponsors: Sponsor[];
    currentSponsorIndex: number;
    match: MatchState;
}

export default function ClassicSponsorTickler({ sponsors, currentSponsorIndex, match }: ClassicSponsorTicklerProps) {
    const isBreak = match.status === 'break';
    const showSponsorCard = !isBreak && match.isSponsorsOverlayActive && sponsors.length > 0;
    const isLogoOnly = match.sponsorDisplayMode === 'logoOnly';

    const positionClass = match.sponsorPosition === 'left'
        ? "left-12 translate-x-0"
        : match.sponsorPosition === 'right'
            ? "right-12 translate-x-0"
            : "left-1/2 -translate-x-1/2";

    const sizeClass = match.sponsorLogoSize === 'sm'
        ? "h-12 max-w-[160px]"
        : match.sponsorLogoSize === 'lg'
            ? "h-28 max-w-[340px]"
            : match.sponsorLogoSize === 'xl'
                ? "h-36 max-w-[440px]"
                : "h-20 max-w-[240px]"; // default 'md'

    const currentSponsor = getActiveSponsor(sponsors, currentSponsorIndex, true);

    return (
        <div className={clsx(
            "absolute bottom-12 transition-all duration-700 ease-in-out z-40 flex items-center justify-center",
            positionClass,
            showSponsorCard ? "translate-y-0 opacity-100 scale-100 pointer-events-auto" : "translate-y-24 opacity-0 scale-95 pointer-events-none"
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
                    <div className="bg-white text-slate-900 p-4 pr-8 rounded-2xl shadow-2xl border border-white/40 flex items-center gap-6 min-w-[340px]">
                        {/* Sponsor Image Container */}
                        <div className="h-16 w-auto min-w-[90px] flex items-center justify-center rounded-xl bg-slate-50 p-2 border border-slate-200 shadow-inner">
                            <img
                                src={currentSponsor?.advertUrl}
                                alt="Sponsor"
                                className="h-full w-auto object-contain max-w-[140px]"
                            />
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Proudly Sponsored By</span>
                            <span className="text-xl font-black text-slate-900 leading-tight tracking-tight line-clamp-1">
                                {currentSponsor?.name}
                            </span>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
