import React from 'react';
import clsx from 'clsx';
import { MatchState } from "@/types/match";
import { getActiveSponsor, Sponsor } from '@/lib/matchHelpers';

interface SponsorBreakDisplayProps {
    sponsors: Sponsor[];
    currentSponsorIndex: number;
    match: MatchState;
}

export default function SponsorBreakDisplay({ sponsors, currentSponsorIndex, match }: SponsorBreakDisplayProps) {
    const isBreak = match.status === 'break';
    const showFullPageAd = isBreak && sponsors.length > 0;
    const targetDuration = match.breakTimerDuration || 60;
    const [breakTimeRemaining, setBreakTimeRemaining] = React.useState<number>(targetDuration);

    React.useEffect(() => {
        if (!isBreak || !match.breakTimerStartTime) {
            setBreakTimeRemaining(targetDuration);
            return;
        }

        const updateRemaining = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - match.breakTimerStartTime!) / 1000);
            setBreakTimeRemaining(targetDuration - elapsed);
        };

        updateRemaining();
        const interval = setInterval(updateRemaining, 500);
        return () => clearInterval(interval);
    }, [isBreak, match.breakTimerStartTime, targetDuration]);

    const formatBreakTime = (seconds: number) => {
        const absSec = Math.abs(seconds);
        const m = Math.floor(absSec / 60);
        const s = Math.floor(absSec % 60);
        const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return seconds < 0 ? `-${formatted}` : formatted;
    };

    const progressPercent = Math.max(0, Math.min(100, (breakTimeRemaining / targetDuration) * 100));

    return (
        <div className={clsx(
            "absolute inset-0 z-50 bg-black/95 flex items-center justify-center transition-opacity duration-1000",
            showFullPageAd ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
            {showFullPageAd && currentSponsor && (
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Background Blur */}
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={currentSponsor.advertUrl}
                            alt="Background"
                            className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
                        />
                    </div>

                    {/* Main Image */}
                    <div className="relative z-10 max-w-[90%] max-h-[90%] flex flex-col items-center gap-8">
                        <img
                            src={currentSponsor.advertUrl}
                            alt={currentSponsor.name}
                            className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-sm"
                        />
                    </div>

                    {/* Break Indicator Pill with Countdown */}
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-xl border border-white/20 px-10 py-4 rounded-full flex items-center gap-6 shadow-2xl">
                        <div className="w-3 h-3 rounded-full bg-[#FF5A09] animate-pulse shadow-[0_0_12px_#FF5A09]" />
                        <span className="text-white font-black uppercase tracking-[0.3em] text-lg">
                            {match.status === 'break' ? "Match Break" : "Ad Break"}
                        </span>
                        <div className="h-5 w-[1px] bg-white/20" />
                        <span className="text-[#FF5A09] font-black tracking-wider text-xl tabular-nums">
                            {formatBreakTime(breakTimeRemaining)}
                        </span>
                    </div>

                    {/* Progress Indicator */}
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#FF5A09] transition-all duration-500 ease-linear"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}


