import { adminDb } from "@/lib/firebase/admin";
import ScoreOverlay from "@/components/public/ScoreOverlay";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function PublicMatchOverlay({
    params
}: {
    params: Promise<{ matchId: string }>
}) {
    const { matchId } = await params;
    let matchData = null;

    try {
        const snapshot = await adminDb.collectionGroup("matches").get();
        const doc = snapshot.docs.find(d => d.id === matchId);
        if (doc?.exists) matchData = doc.data();
    } catch (error) {
        console.error(error);
    }

    if (!matchData) return notFound();

    return (
        // Wrapper must be full screen and transparent for OBS
        <main className="relative h-screen w-screen bg-transparent overflow-hidden">
            <ScoreOverlay
                team1={matchData.team1}
                team2={matchData.team2}
                score1={matchData.score1 || 0}
                score2={matchData.score2 || 0}
                status={matchData.status}
                court={matchData.court}
                // Optional: Pass custom logo or rally info from DB
                logoUrl={matchData.streamerLogo}
                extraInfo={matchData.lastRally ? `Longest Rally: ${matchData.lastRally} Shots` : undefined}
            />
        </main>
    );
}