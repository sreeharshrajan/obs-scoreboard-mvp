import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { FieldValue } from "firebase-admin/firestore";

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

        return NextResponse.json(matches);
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

        return NextResponse.json({ message: "Match deleted successfully" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to delete match";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}