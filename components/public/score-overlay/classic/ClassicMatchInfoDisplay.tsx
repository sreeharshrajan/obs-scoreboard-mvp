import Image from "next/image";
import { MatchState } from "@/types/match";

interface ClassicMatchInfoDisplayProps {
    match: MatchState;
}

export default function ClassicMatchInfoDisplay({ match }: ClassicMatchInfoDisplayProps) {
    const hasCategory = match.matchCategory || match.category;
    const hasTournament = match.tournamentName;

    if (match.showMatchInfo === false || (!hasCategory && !hasTournament)) {
        return null;
    }

    return (
        <div className="absolute top-12 right-12 h-[128px] flex items-stretch gap-4 animate-in slide-in-from-right-8 duration-700">
            <div className="h-full bg-white text-slate-900 px-7 rounded-2xl shadow-2xl border border-white/40 flex flex-col justify-center items-end gap-1.5 min-w-[300px] max-w-[500px]">
                {/* Tournament Tag */}
                {match.tournamentName && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-red-600 to-red-700 px-3 py-1 rounded-md text-right whitespace-normal break-words leading-tight shadow-sm">
                        {match.tournamentName}
                    </span>
                )}

                {/* Match Category / Title */}
                {hasCategory && (
                    <span className="text-lg font-black uppercase tracking-tight text-slate-900 leading-tight text-right whitespace-normal break-words">
                        {hasCategory}
                    </span>
                )}

                {/* Sub details pills: Round, Age Group, Court */}
                {(match.roundType || match.ageGroup || match.court) && (
                    <div className="flex items-center justify-end flex-wrap gap-1.5 mt-0.5">
                        {match.roundType && (
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap">
                                {match.roundType}
                            </span>
                        )}
                        {match.ageGroup && (
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap">
                                {match.ageGroup}
                            </span>
                        )}
                        {match.court && (
                            <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap shadow-xs">
                                {match.court}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Streamer Logo */}
            {match.showStreamerLogo !== false && match.streamerLogo && (
                <div className="relative h-full w-auto shadow-2xl flex items-center justify-center bg-white border border-white/40 rounded-2xl p-3.5">
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
