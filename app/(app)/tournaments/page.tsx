"use client";
import { useEffect, useState } from "react";
import { Trophy, Calendar, MapPin, Search, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";

import { Input } from "@/components/ui/Input";
import GridSkeleton from "@/components/dashboard/grid-skeleton";

import { resolveRoles } from "@/lib/auth/roles";

export default function TournamentListing() {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [usersMap, setUsersMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setTournaments([]);
                setLoading(false);
                setIsAdmin(false);
                return;
            }

            try {
                const roles = resolveRoles(user.email);
                setIsAdmin(roles.isAdmin);
                let q;

                if (roles.isAdmin) {
                    q = query(
                        collection(db, "tournaments"),
                        orderBy("createdAt", "desc")
                    );

                    // Fetch users to get display names
                    try {
                        const token = await user.getIdToken();
                        const res = await fetch("/api/users", {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        if (res.ok) {
                            const usersData = await res.json();
                            const map: Record<string, string> = {};
                            usersData.forEach((u: any) => {
                                map[u.id] = u.displayName || "Unknown User";
                            });
                            setUsersMap(map);
                        }
                    } catch (err) {
                        console.error("Failed to fetch users for mapping", err);
                    }

                } else {
                    q = query(
                        collection(db, "tournaments"),
                        where("ownerId", "==", user.uid),
                        orderBy("createdAt", "desc")
                    );
                }

                const snapshot = await getDocs(q);

                const list = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setTournaments(list);
            } catch (error) {
                console.error("Error fetching tournaments:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);


    const filteredTournaments = tournaments.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col py-6 space-y-8 animate-in fade-in duration-500 overflow-hidden">

            {/* Header Area */}


            {/* Search & Filter Bar */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                    type="text"
                    placeholder="Search tournaments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-12 pr-4 rounded-xl bg-white dark:bg-[#2A2A2A]/40 border border-slate-200 dark:border-white/5 outline-none focus:border-[#FF5A09]/50 transition-all text-sm"
                />
            </div>

            {/* Grid Listing */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <GridSkeleton />
                ) : filteredTournaments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                        {filteredTournaments.map((tournament) => (
                            <TournamentCard
                                key={tournament.id}
                                tournament={tournament}
                                isAdmin={isAdmin}
                                ownerName={usersMap[tournament.ownerId]}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No tournaments found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper function to calculate status based on dates
function getTournamentStatus(startDateStr: string, endDateStr: string, currentStatus: string) {
    if (!startDateStr || !endDateStr) return currentStatus || "Upcoming";

    const now = new Date();
    // Reset time to verify strict date comparison (ignoring time of day)
    now.setHours(0, 0, 0, 0);

    // Parse YYYY-MM-DD strings as local time
    const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);

    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);

    // If clearly past
    if (now > endDate) return "Completed";

    // If currently active (start <= now <= end)
    if (now >= startDate && now <= endDate) return "Live";

    // Otherwise check if it's future
    if (now < startDate) return "Upcoming";

    return currentStatus || "Upcoming";
}

function TournamentCard({ tournament, isAdmin, ownerName }: { tournament: any, isAdmin: boolean, ownerName?: string }) {
    const displayStatus = getTournamentStatus(tournament.startDate, tournament.endDate, tournament.status);

    const statusColors: any = {
        Upcoming: "bg-blue-500/10 text-blue-500",
        Live: "bg-[#FF5A09]/10 text-[#FF5A09]",
        Completed: "bg-slate-500/10 text-slate-500",
    };

    return (
        <Link href={`/tournaments/${tournament.id}`} className="group p-6 rounded-[2rem] bg-white dark:bg-[#2A2A2A]/40 border border-slate-200 dark:border-white/5 hover:border-[#FF5A09]/30 transition-all duration-500 flex flex-col justify-between h-56 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider ${statusColors[displayStatus] || statusColors.Upcoming}`}>
                        {displayStatus}
                    </div>
                    {/* Badge removed as requested */}
                    <ArrowRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="text-xl font-instrument font-medium tracking-tight mb-2 group-hover:text-[#FF5A09] transition-colors line-clamp-1">
                    {tournament.name}
                </h3>

                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <MapPin size={12} className="text-slate-300" /> {tournament.location}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <Calendar size={12} className="text-slate-300" />
                        <span>
                            {tournament.startDate}
                            {isAdmin && ownerName && (
                                <span className="text-slate-500 ml-1">
                                    by {ownerName}
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center relative z-10 pt-4 border-t border-slate-50 dark:border-white/5 mt-auto">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF5A09]" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{tournament.category}</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">{tournament.scoringType}</span>
            </div>

            {/* Hover Background Accent */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#FF5A09]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
    );
}