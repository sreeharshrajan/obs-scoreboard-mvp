import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { memoryCache } from "@/lib/cache/memoryCache";

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

        const { searchParams } = new URL(req.url);
        let tournamentId = searchParams.get("tournamentId");

        // Look up cached tournament route pointer if not in query param
        if (!tournamentId) {
            tournamentId = memoryCache.get<string>(`match-tournament:${matchId}`) || null;
        }

        let matchDoc: FirebaseFirestore.DocumentSnapshot | undefined;
        let sponsors: any[] = [];

        if (tournamentId) {
            // Fetch match and sponsors in parallel for maximum speed
            const matchRef = adminDb
                .collection("tournaments")
                .doc(tournamentId)
                .collection("matches")
                .doc(matchId);

            const sponsorsRef = adminDb
                .collection("tournaments")
                .doc(tournamentId)
                .collection("sponsors");

            const [docSnap, sponsorsSnap] = await Promise.all([
                matchRef.get(),
                sponsorsRef.get(),
            ]);

            if (docSnap.exists) {
                matchDoc = docSnap;
            }

            sponsors = sponsorsSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter((s: any) => s.status !== false)
                .sort((a: any, b: any) => (a.priority || 99) - (b.priority || 99));
        }

        if (!matchDoc) {
            // Fallback: locate match across tournaments
            try {
                const tournamentsSnap = await adminDb.collection("tournaments").get();
                const matchSnaps = await Promise.all(
                    tournamentsSnap.docs.map(tDoc => tDoc.ref.collection("matches").doc(matchId).get())
                );
                const found = matchSnaps.find(snap => snap.exists);
                if (found) {
                    matchDoc = found;
                    const resolvedTId = found.data()?.tournamentId || found.ref.parent?.parent?.id || null;
                    if (resolvedTId) {
                        tournamentId = resolvedTId;
                        memoryCache.set(`match-tournament:${matchId}`, resolvedTId, 3600000);

                        const sponsorsSnap = await adminDb
                            .collection("tournaments")
                            .doc(resolvedTId)
                            .collection("sponsors")
                            .get();

                        sponsors = sponsorsSnap.docs
                            .map(d => ({ id: d.id, ...d.data() }))
                            .filter((s: any) => s.status !== false)
                            .sort((a: any, b: any) => (a.priority || 99) - (b.priority || 99));
                    }
                }
            } catch (err) {
                console.error("Error finding match across tournaments:", err);
            }
        }

        if (!matchDoc || !matchDoc.exists) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        const matchData = matchDoc.data()!;
        const finalTournamentId = tournamentId || matchData.tournamentId || matchDoc.ref.parent?.parent?.id || null;

        if (finalTournamentId) {
            memoryCache.set(`match-tournament:${matchId}`, finalTournamentId, 3600000);
        }

        const responsePayload = {
            match: { id: matchDoc.id, ...matchData },
            sponsors,
            tournamentId: finalTournamentId
        };

        // Live Realtime Response: NO browser/proxy caching for score overlay
        return NextResponse.json(responsePayload, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0",
            }
        });
    } catch (error: any) {
        console.error("Error in public overlay API:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}


