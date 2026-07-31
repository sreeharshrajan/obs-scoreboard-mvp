// app/api/match-assignments/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { enforceSuperAdmin } from "@/lib/permissions/superAdminPolicy";
import { FieldValue } from "firebase-admin/firestore";
import type { PermissionProfileName, PermissionSet } from "@/lib/types/permissions";

/**
 * GET: List match assignments.
 *
 * Query params:
 *   - userId: filter by assigned user
 *   - tournamentId: filter by tournament
 *
 * Super-admin only.
 */
export async function GET(req: Request) {
    try {
        const auth = await verifyRequest(req);

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const tournamentId = searchParams.get("tournamentId");

        if (!auth.roles.isSuperAdmin && !auth.roles.isOrganizer && userId !== auth.uid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let query: FirebaseFirestore.Query = adminDb.collection("match_assignments");

        if (userId) {
            query = query.where("userId", "==", userId);
        }
        if (tournamentId) {
            query = query.where("tournamentId", "==", tournamentId);
        }

        const snapshot = await query.get();

        const assignments = snapshot.docs
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
            .sort((a: any, b: any) => {
                const getTs = (val: any) => {
                    if (!val) return 0;
                    if (typeof val?.toDate === "function") return val.toDate().getTime();
                    if (val?.seconds) return val.seconds * 1000;
                    const parsed = new Date(val).getTime();
                    return isNaN(parsed) ? 0 : parsed;
                };
                return getTs(b.createdAt) - getTs(a.createdAt);
            });

        return NextResponse.json(assignments);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("[MatchAssignments] GET error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * POST: Create a match assignment.
 *
 * Body: {
 *   userId: string
 *   tournamentId: string
 *   matchId?: string           — omit or null for tournament-wide scope
 *   permissionProfile: "scorer" | "referee" | "broadcaster"
 *   permissionOverrides?: Partial<PermissionSet>
 *   organizationId?: string
 * }
 *
 * Super-admin only.
 */
export async function POST(req: Request) {
    try {
        const auth = await verifyRequest(req);
        const superAdminError = enforceSuperAdmin(auth);
        if (superAdminError) return superAdminError;

        const body = await req.json();
        const { userId, tournamentId, matchId, permissionProfile, permissionOverrides, organizationId } = body;

        // Validation
        if (!userId || !tournamentId) {
            return NextResponse.json(
                { error: "userId and tournamentId are required" },
                { status: 400 }
            );
        }

        const validProfiles: PermissionProfileName[] = ["scorer", "referee", "broadcaster"];
        if (!permissionProfile || !validProfiles.includes(permissionProfile)) {
            return NextResponse.json(
                { error: `permissionProfile must be one of: ${validProfiles.join(", ")}` },
                { status: 400 }
            );
        }

        // Check for duplicate assignment
        const scope = matchId ? "match" : "tournament";
        let duplicateQuery = adminDb.collection("match_assignments")
            .where("userId", "==", userId)
            .where("tournamentId", "==", tournamentId)
            .where("scope", "==", scope);

        if (matchId) {
            duplicateQuery = duplicateQuery.where("matchId", "==", matchId);
        }

        const existing = await duplicateQuery.limit(1).get();
        if (!existing.empty) {
            return NextResponse.json(
                { error: "An assignment already exists for this user and scope. Update or delete it instead." },
                { status: 409 }
            );
        }

        // Verify the user exists
        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Create assignment
        const assignmentData = {
            userId,
            tournamentId,
            matchId: matchId || null,
            scope,
            organizationId: organizationId || null,
            permissionProfile,
            permissionOverrides: permissionOverrides || null,
            createdBy: auth.uid,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb.collection("match_assignments").add(assignmentData);

        return NextResponse.json(
            { success: true, id: docRef.id, ...assignmentData },
            { status: 201 }
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("[MatchAssignments] POST error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
