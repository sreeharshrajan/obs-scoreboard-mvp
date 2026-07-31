// app/api/tournaments/[id]/matches/[matchId]/timer/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { canControlTimer } from "@/lib/permissions/matchPermissions";

/**
 * PATCH: Update timer-related fields only.
 *
 * Allowed fields: isTimerRunning, timerStartTime, timerElapsed.
 *
 * Requires `canControlTimer` permission.
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; matchId: string }> }
) {
    try {
        const { id: tournamentId, matchId } = await params;
        const auth = await verifyRequest(req);

        const hasPermission = await canControlTimer(auth, tournamentId, matchId, req);
        if (!hasPermission) {
            return NextResponse.json(
                { error: "Forbidden: Timer permission required" },
                { status: 403 }
            );
        }

        const body = await req.json();

        // Whitelist only timer-related fields
        const allowed: Record<string, any> = {};
        if (typeof body.isTimerRunning === "boolean") allowed.isTimerRunning = body.isTimerRunning;
        if (body.timerStartTime !== undefined) allowed.timerStartTime = body.timerStartTime;
        if (body.timerElapsed !== undefined) allowed.timerElapsed = body.timerElapsed;

        if (Object.keys(allowed).length === 0) {
            return NextResponse.json(
                { error: "No valid timer fields provided" },
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
                action: "timer_update",
                performedBy: auth.uid,
                performedByEmail: auth.email,
                payload: allowed,
                timestamp: new Date().toISOString(),
            })
            .catch((err) => console.warn("[AuditLog] Error writing timer log:", err));

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
