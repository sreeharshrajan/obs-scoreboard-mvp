import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { FieldValue } from "firebase-admin/firestore";
import { memoryCache } from "@/lib/cache/memoryCache";

/**
 * GET: Fetch all matches for a specific tournament
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tournamentId } = await params;

        const snapshot = await adminDb
            .collection("tournaments")
            .doc(tournamentId)
            .collection("matches")
            .orderBy("createdAt", "desc")
            .get();

        const matches = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Keep match-to-tournament routing pointers
        for (const m of matches) {
            memoryCache.set(`match-tournament:${m.id}`, tournamentId, 3600000);
        }

        return NextResponse.json(matches, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
            }
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch matches";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * POST: Create a new match in the tournament subcollection
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tournamentId } = await params;
        await verifyRequest(req); // Ensure user is authenticated

        const body = await req.json();

        const newMatch = {
            ...body,
            tournamentId,
            status: body.status || "scheduled",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb
            .collection("tournaments")
            .doc(tournamentId)
            .collection("matches")
            .add(newMatch);

        // Invalidate tournament matches cache and record tournament mapping
        memoryCache.invalidate(`tournament-matches:${tournamentId}`);
        memoryCache.set(`match-tournament:${docRef.id}`, tournamentId, 3600000);

        return NextResponse.json({ id: docRef.id, ...newMatch }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create match";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * PATCH: Update match details (Score, Status, Teams)
 * Expects { matchId: string, ...updates } in the body
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tournamentId } = await params;
        await verifyRequest(req);

        const { matchId, ...updates } = await req.json();

        if (!matchId) {
            return NextResponse.json({ error: "Match ID is required" }, { status: 400 });
        }

        const matchRef = adminDb
            .collection("tournaments")
            .doc(tournamentId)
            .collection("matches")
            .doc(matchId);

        await matchRef.update({
            ...updates,
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Invalidate caches
        memoryCache.invalidate(`tournament-matches:${tournamentId}`);
        memoryCache.invalidate(`match:${tournamentId}:${matchId}`);
        memoryCache.invalidate(`overlay:${matchId}`);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to update match";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * DELETE: Remove a match from the tournament
 * Expects { matchId: string } in the body
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tournamentId } = await params;
        await verifyRequest(req);

        const { matchId } = await req.json();

        if (!matchId) {
            return NextResponse.json({ error: "Match ID is required" }, { status: 400 });
        }

        await adminDb
            .collection("tournaments")
            .doc(tournamentId)
            .collection("matches")
            .doc(matchId)
            .delete();

        // Invalidate caches
        memoryCache.invalidate(`tournament-matches:${tournamentId}`);
        memoryCache.invalidate(`match:${tournamentId}:${matchId}`);
        memoryCache.invalidate(`overlay:${matchId}`);

        return NextResponse.json({ message: "Match deleted successfully" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to delete match";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}