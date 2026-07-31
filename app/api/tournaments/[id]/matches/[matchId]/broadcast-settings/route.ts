// app/api/tournaments/[id]/matches/[matchId]/broadcast-settings/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { canAccessBroadcastSettings } from "@/lib/permissions/matchPermissions";

/**
 * PATCH: Update broadcast / overlay settings only.
 *
 * Allowed fields: overlayTemplate, showTournamentLogo, showStreamerLogo,
 * showMatchInfo, showFullScreenMatchDetails, isSponsorsOverlayActive,
 * sponsorDisplayMode, sponsorPosition, sponsorLogoSize, overlayScale,
 * tournamentLogo, streamerLogo.
 *
 * Requires `canAccessBroadcastSettings` permission.
 * Scorers CAN access this. Match details (player names, format) are separate.
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; matchId: string }> }
) {
    try {
        const { id: tournamentId, matchId } = await params;
        const auth = await verifyRequest(req);

        const hasPermission = await canAccessBroadcastSettings(auth, tournamentId, matchId, req);
        if (!hasPermission) {
            return NextResponse.json(
                { error: "Forbidden: Broadcast settings permission required" },
                { status: 403 }
            );
        }

        const body = await req.json();

        // Whitelist broadcast/overlay fields
        const broadcastFields = [
            "overlayTemplate",
            "showTournamentLogo",
            "showStreamerLogo",
            "showMatchInfo",
            "showFullScreenMatchDetails",
            "isSponsorsOverlayActive",
            "sponsorDisplayMode",
            "sponsorPosition",
            "sponsorLogoSize",
            "overlayScale",
            "tournamentLogo",
            "streamerLogo",
            "tournamentName",
            "category",
        ];

        const allowed: Record<string, any> = {};
        for (const key of broadcastFields) {
            if (body[key] !== undefined) {
                allowed[key] = body[key];
            }
        }

        if (Object.keys(allowed).length === 0) {
            return NextResponse.json(
                { error: "No valid broadcast settings provided" },
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

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
