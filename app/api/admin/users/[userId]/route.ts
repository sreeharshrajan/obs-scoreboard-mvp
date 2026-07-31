// app/api/admin/users/[userId]/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { enforceSuperAdmin } from "@/lib/permissions/superAdminPolicy";

/**
 * GET: Fetch detailed user info (super-admin only)
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const auth = await verifyRequest(req);
        const superAdminError = enforceSuperAdmin(auth);
        if (superAdminError) return superAdminError;

        const { userId } = await params;

        const [userRecord, userDoc] = await Promise.all([
            adminAuth.getUser(userId),
            adminDb.collection("users").doc(userId).get(),
        ]);

        const userData = userDoc.exists ? userDoc.data() : {};

        return NextResponse.json({
            id: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            role: userData?.role || "viewer",
            organizationId: userData?.organizationId || null,
            isActive: userData?.isActive !== false,
            mustChangePassword: userData?.mustChangePassword === true,
            createdAt: userRecord.metadata.creationTime,
            lastLoginAt: userData?.lastLoginAt || userRecord.metadata.lastSignInTime || null,
            ...userData,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * PATCH: Update user status / reset password (super-admin only)
 *
 * Body can include:
 *   - isActive: boolean        — toggle account active/inactive
 *   - resetPassword: true      — generate password reset link
 *   - resendWelcome: true      — generate password reset link (same mechanism, different intent)
 *   - role: UserRole           — change user role
 *   - displayName: string      — update display name
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const auth = await verifyRequest(req);
        const superAdminError = enforceSuperAdmin(auth);
        if (superAdminError) return superAdminError;

        const { userId } = await params;
        const body = await req.json();
        const result: Record<string, any> = { success: true };

        // Prevent self-deactivation
        if (body.isActive === false && userId === auth.uid) {
            return NextResponse.json(
                { error: "You cannot deactivate your own account" },
                { status: 403 }
            );
        }

        // Update Firestore fields
        const firestoreUpdates: Record<string, any> = {
            updatedAt: new Date(),
        };

        if (typeof body.isActive === "boolean") {
            firestoreUpdates.isActive = body.isActive;
        }
        if (body.role) {
            firestoreUpdates.role = body.role;
        }
        if (body.displayName) {
            firestoreUpdates.displayName = body.displayName;
        }

        await adminDb.collection("users").doc(userId).set(firestoreUpdates, { merge: true });

        // Update Firebase Auth display name if changed
        if (body.displayName) {
            await adminAuth.updateUser(userId, { displayName: body.displayName });
        }

        // Password reset
        if (body.resetPassword || body.resendWelcome) {
            const userRecord = await adminAuth.getUser(userId);
            if (userRecord.email) {
                const resetLink = await adminAuth.generatePasswordResetLink(userRecord.email);
                result.resetLink = resetLink;
                result.message = body.resendWelcome
                    ? "Welcome email reset link generated"
                    : "Password reset link generated";
            }
        }

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("[Admin/Users] PATCH error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
