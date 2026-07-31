// app/api/tournaments/[id]/matches/[matchId]/permissions/route.ts
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { resolveMatchPermissions } from "@/lib/permissions/matchPermissions";

/**
 * GET: Resolve and return the current user's permissions for this match.
 *
 * Returns the versioned MatchPermissions object + assignment metadata
 * (who assigned this user, when, what profile, what scope).
 * This allows the UI to make all permission decisions client-side
 * without hardcoding role checks.
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

        const result = await resolveMatchPermissions(auth, tournamentId, matchId, req);

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
