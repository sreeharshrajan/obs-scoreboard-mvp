import { adminDb } from "@/lib/firebase/admin";
import ScoreOverlay from "@/components/public/ScoreOverlay";
import { notFound } from "next/navigation";
import { memoryCache } from "@/lib/cache/memoryCache";

export const dynamic = 'force-dynamic';

export default async function PublicMatchOverlay({
    params
}: {
    params: Promise<{ matchId: string }>
}) {
    const { matchId } = await params;
    let matchData: any = null;
    let tournamentId: string | null = null;

    try {
        const cachedTournamentId = memoryCache.get<string>(`match-tournament:${matchId}`);
        if (cachedTournamentId) {
            const doc = await adminDb
                .collection("tournaments")
                .doc(cachedTournamentId)
                .collection("matches")
                .doc(matchId)
                .get();

            if (doc.exists) {
                matchData = doc.data();
                tournamentId = cachedTournamentId;
            }
        }

        if (!matchData) {
            const snapshot = await adminDb.collectionGroup("matches").get();
            const doc = snapshot.docs.find(d => d.id === matchId);
            if (doc?.exists) {
                matchData = doc.data();
                tournamentId = matchData?.tournamentId || doc.ref.parent?.parent?.id || null;
                if (tournamentId) {
                    memoryCache.set(`match-tournament:${matchId}`, tournamentId, 3600000);
                }
            }
        }
    } catch (error) {
        console.error("Overlay load error:", error);
    }

    if (!matchData) return notFound();

    return (
        // Wrapper must be full screen and transparent for OBS
        <main className="relative h-screen w-screen bg-transparent overflow-hidden">
            <ScoreOverlay matchId={matchId} initialTournamentId={tournamentId} />
        </main>
    );
}