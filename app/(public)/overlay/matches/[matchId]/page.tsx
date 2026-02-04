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
            <ScoreOverlay matchId={matchId}/>
        </main>
    );
}