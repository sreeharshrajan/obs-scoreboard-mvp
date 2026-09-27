import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { memoryCache } from "@/lib/cache/memoryCache";

/**
 * Helper to find a match document reference by ID across all tournaments
 */
async function findMatchDoc(matchId: string) {
    // 1. Direct lookup if tournament ID is cached
    const cachedTournamentId = memoryCache.get<string>(`match-tournament:${matchId}`);
    if (cachedTournamentId) {
        const docRef = adminDb
            .collection("tournaments")
            .doc(cachedTournamentId)
            .collection("matches")
            .doc(matchId);
        const doc = await docRef.get();
        if (doc.exists) return doc;
    }

    // 2. Fallback: Search tournaments to find match
    const snapshot = await adminDb.collectionGroup("matches").get();
    const doc = snapshot.docs.find((d) => d.id === matchId);
    if (doc) {
        const tId = doc.data().tournamentId || doc.ref.parent?.parent?.id;
        if (tId) {
            memoryCache.set(`match-tournament:${matchId}`, tId, 3600000);
        }
    }
    return doc || null;
}

/**
 * GET: Fetch a single match by ID
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        try {
            await verifyRequest(req);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doc = await findMatchDoc(id);

        if (!doc || !doc.exists) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        const payload = { id: doc.id, ...doc.data() };

        return NextResponse.json(payload, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
            }
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * PATCH: Update match details
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        try {
            await verifyRequest(req);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doc = await findMatchDoc(id);

        if (!doc) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        await doc.ref.set({
            ...body,
            updatedAt: new Date().toISOString(),
        }, { merge: true });

        const tId = doc.data()?.tournamentId || doc.ref.parent?.parent?.id;
        if (tId) {
            memoryCache.invalidate(`tournament-matches:${tId}`);
            memoryCache.invalidate(`match:${tId}:${id}`);
        }
        memoryCache.invalidate(`match:any:${id}`);
        memoryCache.invalidate(`overlay:${id}`);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * DELETE: Remove a match
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        try {
            await verifyRequest(req);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doc = await findMatchDoc(id);

        if (!doc) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        const tId = doc.data()?.tournamentId || doc.ref.parent?.parent?.id;

        await doc.ref.delete();

        if (tId) {
            memoryCache.invalidate(`tournament-matches:${tId}`);
            memoryCache.invalidate(`match:${tId}:${id}`);
        }
        memoryCache.invalidate(`match:any:${id}`);
        memoryCache.invalidate(`overlay:${id}`);

        return NextResponse.json({ success: true, message: "Match deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}