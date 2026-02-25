import Image from "next/image";
import { MatchState } from "@/types/match";

interface MatchInfoDisplayProps {
    match: MatchState;
}

export default function MatchInfoDisplay({ match }: MatchInfoDisplayProps) {
    return (
        <div className="absolute top-12 right-12 flex flex-row items-start gap-6 animate-in slide-in-from-right-12 duration-700">
            {match.showMatchInfo !== false && (match.matchCategory || match.category || match.tournamentName) && (
                <div className="bg-black/90 text-white px-8 py-6 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] flex items-center gap-6 border border-white/10 backdrop-blur-xl">
                    <div className="flex flex-col gap-1 text-right">
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF5A09] mb-2">{match.tournamentName || "Tournament"}</span>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black uppercase tracking-tight text-white">{match.matchCategory || match.category || "Match"}</span>
                            <div className="flex items-center justify-end gap-3 text-xs font-bold text-white/40 uppercase tracking-[0.15em] mt-2">
                                {match.roundType && <span>{match.roundType}</span>}
                                {match.roundType && match.ageGroup && <span className="text-[#FF5A09]/40">•</span>}
                                {match.ageGroup && <span>{match.ageGroup}</span>}
                                {(match.roundType || match.ageGroup) && match.court && <span className="text-[#FF5A09]/40">•</span>}
                                {match.court && <span>{match.court}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {match.showStreamerLogo !== false && match.streamerLogo && (
                <div className="relative h-[100px] w-auto drop-shadow-2xl">
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

