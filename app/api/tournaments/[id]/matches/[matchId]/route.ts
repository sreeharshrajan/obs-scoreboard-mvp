import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { canEditMatch, resolveMatchPermissions } from "@/lib/permissions/matchPermissions";
import { enforceSuperAdmin } from "@/lib/permissions/superAdminPolicy";

/**
 * GET: Fetch a single match by ID from a specific tournament.
 *
 * Access: Any authenticated user with at least one match permission
 * (super-admin, organizer, or assigned staff).
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string; matchId: string }> }
) {
    try {
        const { id: tournamentId, matchId } = await params;

        let auth;
        try {
            auth = await verifyRequest(req);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user has any permission on this match
        const { permissions, assignment } = await resolveMatchPermissions(
            auth, tournamentId, matchId, req
        );

        // If no assignment and not an admin/organizer, deny
        const hasAnyAccess =
            permissions.canScore ||
            permissions.canEditMatch ||
            permissions.canAccessBroadcastSettings ||
            permissions.canManageTournament;

        if (!hasAnyAccess) {
            return NextResponse.json(
                { error: "Forbidden: No access to this match" },
                { status: 403 }
            );
        }

        const doc = await adminDb
            .collection("tournaments")
            .doc(tournamentId)
            .collection("matches")
            .doc(matchId)
            .get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * PATCH: Update match details (player names, format, court, etc.).
 *
 * This is the "edit match" endpoint — restricted to users with
 * `canEditMatch` permission (organizers and super-admins).
 *
 * Scoring, timer, state, and broadcast changes use their own
 * dedicated sub-endpoints.
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; matchId: string }> }
) {
    try {
        const { id: tournamentId, matchId } = await params;
        const body = await req.json();

        let auth;
        try {
            auth = await verifyRequest(req);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const hasPermission = await canEditMatch(auth, tournamentId, matchId, req);
        if (!hasPermission) {
            return NextResponse.json(
                { error: "Forbidden: Edit match permission required" },
                { status: 403 }
            );
        }

        const matchRef = adminDb
            .collection("tournaments")
            .doc(tournamentId)
            .collection("matches")
            .doc(matchId);

        const doc = await matchRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        await matchRef.set({
            ...body,
            updatedAt: new Date().toISOString(),
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * DELETE: Remove a match.
 * Restricted to super-admins only.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; matchId: string }> }
) {
    try {
        const { id: tournamentId, matchId } = await params;

        let auth;
        try {
            auth = await verifyRequest(req);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const superAdminError = enforceSuperAdmin(auth);
        if (superAdminError) return superAdminError;

        await adminDb
            .collection("tournaments")
            .doc(tournamentId)
            .collection("matches")
            .doc(matchId)
            .delete();

        return NextResponse.json({ success: true, message: "Match deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

