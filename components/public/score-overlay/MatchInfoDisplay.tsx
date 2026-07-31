import Image from "next/image";
import { MatchState } from "@/types/match";

interface MatchInfoDisplayProps {
    match: MatchState;
}

export default function MatchInfoDisplay({ match }: MatchInfoDisplayProps) {
    const hasCategory = match.matchCategory || match.category;
    const hasTournament = match.tournamentName;

    if (match.showMatchInfo === false || (!hasCategory && !hasTournament)) {
        return null;
    }

    return (
        <div className="absolute top-12 right-12 h-[128px] flex items-stretch gap-4 animate-in slide-in-from-right-8 duration-700">
            <div className="h-full bg-slate-950/90 text-white px-7 rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.45)] border border-white/10 backdrop-blur-xl flex flex-col justify-center items-end gap-1.5 min-w-[300px] max-w-[500px]">
                {/* Tournament Tag - Wraps naturally onto next lines, NO ellipsis or text trimming */}
                {match.tournamentName && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5A09] bg-[#FF5A09]/10 border border-[#FF5A09]/20 px-2.5 py-1 rounded-md text-right whitespace-normal break-words leading-tight">
                        {match.tournamentName}
                    </span>
                )}

                {/* Match Category / Title */}
                {hasCategory && (
                    <span className="text-lg font-black uppercase tracking-tight text-white/95 leading-tight text-right whitespace-normal break-words">
                        {hasCategory}
                    </span>
                )}

                {/* Sub details pills: Round, Age Group, Court */}
                {(match.roundType || match.ageGroup || match.court) && (
                    <div className="flex items-center justify-end flex-wrap gap-1.5 mt-0.5">
                        {match.roundType && (
                            <span className="text-[10px] font-bold text-white/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap">
                                {match.roundType}
                            </span>
                        )}
                        {match.ageGroup && (
                            <span className="text-[10px] font-bold text-white/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap">
                                {match.ageGroup}
                            </span>
                        )}
                        {match.court && (
                            <span className="text-[10px] font-bold text-[#FF5A09] bg-[#FF5A09]/10 border border-[#FF5A09]/20 px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap">
                                {match.court}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Streamer Logo */}
            {match.showStreamerLogo !== false && match.streamerLogo && (
                <div className="relative h-full w-auto drop-shadow-lg flex items-center justify-center bg-slate-950/90 border border-white/10 rounded-2xl p-3.5 backdrop-blur-xl">
                    <img
                        src={match.streamerLogo}
                        alt="Streamer Logo"
                        className="h-full w-auto object-contain"
                    />
                </div>
            )}
        </div>
    );
}

