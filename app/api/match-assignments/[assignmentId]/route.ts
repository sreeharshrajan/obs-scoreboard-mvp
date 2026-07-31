// app/api/match-assignments/[assignmentId]/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { enforceSuperAdmin } from "@/lib/permissions/superAdminPolicy";
import type { PermissionProfileName, PermissionSet } from "@/lib/types/permissions";

/**
 * PATCH: Update an assignment's permissions or profile.
 *
 * Body can include:
 *   - permissionProfile: PermissionProfileName
 *   - permissionOverrides: Partial<PermissionSet> | null
 *
 * Super-admin only.
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const auth = await verifyRequest(req);
        const superAdminError = enforceSuperAdmin(auth);
        if (superAdminError) return superAdminError;

        const { assignmentId } = await params;
        const body = await req.json();

        const docRef = adminDb.collection("match_assignments").doc(assignmentId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
        }

        const updates: Record<string, any> = {
            updatedAt: new Date(),
        };

        if (body.permissionProfile) {
            const validProfiles: PermissionProfileName[] = ["scorer", "referee", "broadcaster"];
            if (!validProfiles.includes(body.permissionProfile)) {
                return NextResponse.json(
                    { error: `permissionProfile must be one of: ${validProfiles.join(", ")}` },
                    { status: 400 }
                );
            }
            updates.permissionProfile = body.permissionProfile;
        }

        if (body.permissionOverrides !== undefined) {
            updates.permissionOverrides = body.permissionOverrides;
        }

        await docRef.update(updates);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("[MatchAssignments] PATCH error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * DELETE: Remove an assignment.
 * Super-admin only.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const auth = await verifyRequest(req);
        const superAdminError = enforceSuperAdmin(auth);
        if (superAdminError) return superAdminError;

        const { assignmentId } = await params;

        const docRef = adminDb.collection("match_assignments").doc(assignmentId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
        }

        await docRef.delete();

        return NextResponse.json({ success: true, message: "Assignment deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("[MatchAssignments] DELETE error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
