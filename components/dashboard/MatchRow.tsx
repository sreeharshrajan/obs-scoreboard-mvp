import Link from "next/link";
import { MoreHorizontal } from 'lucide-react';

interface Match {
    id: string;
    status: string;
    team1: string;
    team2: string;
    court: string;
    startTime?: string;
}

function MatchRow({ match, tournamentId }: { match: Match; tournamentId: string }) {
    const isLive = match.status === "live" || match.status === "in_progress";

    return (
        <tr className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
            <td className="px-8 py-5">
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${isLive ? "bg-red-500/10 text-red-500" : "bg-slate-100 dark:bg-white/5 text-slate-500"
                    }`}>
                    {isLive && <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />}
                    {match.status}
                </div>
            </td>
            <td className="px-8 py-5">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {match.team1} <span className="text-slate-400 font-medium px-1">vs</span> {match.team2}
                    </span>
                    {match.startTime && <span className="text-[9px] text-slate-400 uppercase tracking-wide">{match.startTime}</span>}
                </div>
            </td>
            <td className="px-8 py-5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {match.court || "TBD"}
                </span>
            </td>
            <td className="px-8 py-5 text-right">
                <Link
                    href={`/tournaments/${tournamentId}/matches/${match.id}`}
                    className="inline-flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors"
                >
                    <MoreHorizontal size={16} />
                </Link>
            </td>
        </tr>
    );
}

export default MatchRow;