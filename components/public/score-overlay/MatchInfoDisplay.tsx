import Image from "next/image";

interface MatchInfoDisplayProps {
    match: MatchState;
}

export default function MatchInfoDisplay({ match }: MatchInfoDisplayProps) {
    return (
        <div className="absolute top-8 right-8 flex flex-row items-start gap-4 animate-in slide-in-from-right-8 duration-500">
            {match.showMatchInfo !== false && (match.matchCategory || match.category || match.tournamentName) && (
                <div className="bg-black/90 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-md">
                    <div className="flex flex-col gap-0.5 text-right">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF5A09] mb-1">{match.tournamentName || "Tournament"}</span>
                        <div className="flex flex-col">
                            <span className="text-sm font-black uppercase tracking-tight text-white">{match.matchCategory || match.category || "Match"}</span>
                            <div className="flex items-center justify-end gap-2 text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">
                                {match.roundType && <span>{match.roundType}</span>}
                                {match.roundType && match.ageGroup && <span>•</span>}
                                {match.ageGroup && <span>{match.ageGroup}</span>}
                                {(match.roundType || match.ageGroup) && match.court && <span>•</span>}
                                {match.court && <span>{match.court}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {match.showStreamerLogo !== false && match.streamerLogo && (
                <Image
                    src={match.streamerLogo}
                    alt="Streamer Logo"
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="h-[72px] w-auto object-contain drop-shadow-md"
                />
            )}
        </div>
    );
}
