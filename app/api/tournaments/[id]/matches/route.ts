import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { enforceOrganizer } from "@/lib/permissions/adminPolicy";
import { FieldValue } from "firebase-admin/firestore";

/**
 * GET: Fetch all matches for a specific tournament.
 *
 * - Super-admins and organizers see all matches.
 * - Staff users see only matches they are assigned to
 *   (either directly or via a tournament-wide assignment).
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tournamentId } = await params;

        let auth;
        try {
            auth = await verifyRequest(req);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const snapshot = await adminDb
            .collection("tournaments")
            .doc(tournamentId)
            .collection("matches")
            .orderBy("createdAt", "desc")
            .get();

        let matches = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Filter for staff users — only show assigned matches
        if (auth.roles.isStaff && !auth.roles.isOrganizer && !auth.roles.isSuperAdmin) {
            const assignmentsSnap = await adminDb
                .collection("match_assignments")
                .where("userId", "==", auth.uid)
                .where("tournamentId", "==", tournamentId)
                .get();

            if (assignmentsSnap.empty) {
                return NextResponse.json([]);
            }

            // Check for tournament-wide assignment
            const hasTournamentScope = assignmentsSnap.docs.some(
                doc => doc.data().scope === "tournament"
            );

            if (!hasTournamentScope) {
                // Filter to only assigned match IDs
                const assignedMatchIds = new Set(
                    assignmentsSnap.docs
                        .filter(doc => doc.data().matchId)
                        .map(doc => doc.data().matchId)
                );
                matches = matches.filter(m => assignedMatchIds.has(m.id));
            }
        }

        return NextResponse.json(matches);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch matches";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * POST: Create a new match in the tournament subcollection.
 * Restricted to organizers and super-admins.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tournamentId } = await params;
        const auth = await verifyRequest(req);

        const orgError = enforceOrganizer(auth);
        if (orgError) return orgError;

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
 * PATCH: Update match details (Score, Status, Teams).
 * Expects { matchId: string, ...updates } in the body.
 * Restricted to organizers and super-admins.
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tournamentId } = await params;
        const auth = await verifyRequest(req);

        const orgError = enforceOrganizer(auth);
        if (orgError) return orgError;

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
 * DELETE: Remove a match from the tournament.
 * Expects { matchId: string } in the body.
 * Restricted to organizers and super-admins.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tournamentId } = await params;
        const auth = await verifyRequest(req);

        const orgError = enforceOrganizer(auth);
        if (orgError) return orgError;

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