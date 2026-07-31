// app/api/tournaments/[id]/matches/[matchId]/score/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { canScoreMatch } from "@/lib/permissions/matchPermissions";

/**
 * PATCH: Update score-related fields only.
 *
 * Allowed fields: player1, player2, currentServer, gameHistory,
 * serverNumber, scoreEvents, status (live only — starting the match).
 *
 * Requires `canScore` permission.
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

        // Whitelist only score-related fields
        const allowed: Record<string, any> = {};
        if (body.player1) allowed.player1 = body.player1;
        if (body.player2) allowed.player2 = body.player2;
        if (body.currentServer) allowed.currentServer = body.currentServer;
        if (body.gameHistory) allowed.gameHistory = body.gameHistory;
        if (body.serverNumber !== undefined) allowed.serverNumber = body.serverNumber;
        if (body.scoreEvents) allowed.scoreEvents = body.scoreEvents;
        // Allow setting status to 'live' when scoring starts
        if (body.status === "live" || body.status === "completed") {
            allowed.status = body.status;
        }
        if (body.completedAt !== undefined) allowed.completedAt = body.completedAt;

        if (Object.keys(allowed).length === 0) {
            return NextResponse.json(
                { error: "No valid score fields provided" },
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
                action: "score_update",
                performedBy: auth.uid,
                performedByEmail: auth.email,
                payload: allowed,
                timestamp: new Date().toISOString(),
            })
            .catch((err) => console.warn("[AuditLog] Error writing score log:", err));

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
