import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldPath } from "firebase-admin/firestore";

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
        const tournamentIdParam = searchParams.get("tournamentId");

        let matchDoc: FirebaseFirestore.DocumentSnapshot | undefined;

        if (tournamentIdParam) {
            const docRef = adminDb
                .collection("tournaments")
                .doc(tournamentIdParam)
                .collection("matches")
                .doc(matchId);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                matchDoc = docSnap;
            }
        }

        if (!matchDoc) {
            let snapshot = await adminDb
                .collectionGroup("matches")
                .where("matchId", "==", matchId)
                .limit(1)
                .get();

            if (snapshot.empty) {
                snapshot = await adminDb
                    .collectionGroup("matches")
                    .where("id", "==", matchId)
                    .limit(1)
                    .get();
            }

            if (snapshot.empty) {
                snapshot = await adminDb
                    .collectionGroup("matches")
                    .where(FieldPath.documentId(), "==", matchId)
                    .limit(1)
                    .get();
            }

            if (!snapshot.empty) {
                matchDoc = snapshot.docs[0];
            }
        }

        if (!matchDoc || !matchDoc.exists) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        const matchData = matchDoc.data()!;
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
