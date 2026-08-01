import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ matchId: string }> }
) {
    try {
        const { matchId } = await params;
        if (!matchId) {
            return NextResponse.json({ error: "Match ID required" }, { status: 400 });
        }

        const snapshot = await adminDb.collectionGroup("matches").get();
        const matchDoc = snapshot.docs.find(d => d.id === matchId);

        if (!matchDoc || !matchDoc.exists) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        const matchData = matchDoc.data();
        const tournamentId = matchData.tournamentId || matchDoc.ref.parent?.parent?.id || null;

        let sponsors: any[] = [];
        if (tournamentId) {
            const sponsorsSnap = await adminDb
                .collection("tournaments")
                .doc(tournamentId)
                .collection("sponsors")
                .get();

            sponsors = sponsorsSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter((s: any) => s.status !== false)
                .sort((a: any, b: any) => (a.priority || 99) - (b.priority || 99));
        }

        return NextResponse.json({
            match: { id: matchDoc.id, ...matchData },
            sponsors,
            tournamentId
        });
    } catch (error: any) {
        console.error("Error in public overlay API:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
