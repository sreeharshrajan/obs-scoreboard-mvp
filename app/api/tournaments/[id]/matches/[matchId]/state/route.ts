// app/api/tournaments/[id]/matches/[matchId]/state/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { canScoreMatch } from "@/lib/permissions/matchPermissions";

/**
 * PATCH: Update match state / status.
 *
 * Allowed fields: status (live, break, completed, scheduled), completedAt.
 *
 * Requires `canScore` permission (same as scoring — state transitions
 * like "end match" and "toggle break" are scoring operations).
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; matchId: string }> }
) {
    try {
        const { id: tournamentId, matchId } = await params;
        const auth = await verifyRequest(req);

        const hasPermission = await canScoreMatch(auth, tournamentId, matchId, req);
        if (!hasPermission) {
            return NextResponse.json(
                { error: "Forbidden: Score permission required" },
                { status: 403 }
            );
        }

        const body = await req.json();

        // Whitelist only state-related fields
        const allowed: Record<string, any> = {};
        const validStatuses = ["scheduled", "live", "completed", "break"];
        if (body.status && validStatuses.includes(body.status)) {
            allowed.status = body.status;
        }
        if (body.completedAt !== undefined) allowed.completedAt = body.completedAt;

        if (Object.keys(allowed).length === 0) {
            return NextResponse.json(
                { error: "No valid state fields provided" },
                { status: 400 }
            );
        }

        allowed.updatedAt = new Date().toISOString();

        const matchRef = adminDb
            .collection("tournaments")
            .doc(tournamentId)
            .collection("matches")
            .doc(matchId);

        await matchRef.set(allowed, { merge: true });

        // Audit Log Entry
        adminDb
            .collection("tournaments")
            .doc(tournamentId)
            .collection("matches")
            .doc(matchId)
            .collection("audit_log")
            .add({
                action: "state_update",
                performedBy: auth.uid,
                performedByEmail: auth.email,
                payload: allowed,
                timestamp: new Date().toISOString(),
            })
            .catch((err) => console.warn("[AuditLog] Error writing state log:", err));

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
