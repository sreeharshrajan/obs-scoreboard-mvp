// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { enforceSuperAdmin } from "@/lib/permissions/superAdminPolicy";
import { FieldValue } from "firebase-admin/firestore";
import type { UserRole } from "@/lib/types/permissions";

/**
 * POST: Create a new user (super-admin only).
 *
 * Body: {
 *   displayName: string
 *   email: string
 *   password: string
 *   role: "organizer" | "staff" | "viewer"
 *   organizationId?: string
 * }
 *
 * Creates a Firebase Auth account (email/password) + Firestore user doc.
 * Sets mustChangePassword = true so the user is prompted on first login.
 */
export async function POST(req: Request) {
    try {
        const auth = await verifyRequest(req);

        const superAdminError = enforceSuperAdmin(auth);
        if (superAdminError) return superAdminError;

        const body = await req.json();
        const { displayName, email, password, role, organizationId } = body;

        // Validation
        if (!displayName || !email || !password) {
            return NextResponse.json(
                { error: "displayName, email, and password are required" },
                { status: 400 }
            );
        }

        const validRoles: UserRole[] = ["organizer", "staff", "viewer"];
        if (!role || !validRoles.includes(role)) {
            return NextResponse.json(
                { error: `role must be one of: ${validRoles.join(", ")}` },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Create Firebase Auth account
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName,
            emailVerified: false,
        });

        // Create Firestore user document
        await adminDb.collection("users").doc(userRecord.uid).set({
            displayName,
            email,
            role,
            organizationId: organizationId || null,
            isActive: true,
            mustChangePassword: true,
            createdBy: auth.uid,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json(
            {
                success: true,
                user: {
                    id: userRecord.uid,
                    email: userRecord.email,
                    displayName: userRecord.displayName,
                    role,
                },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("[Admin/Users] Create user error:", error);

        // Handle Firebase Auth specific errors
        if (error && typeof error === "object" && "code" in error) {
            const firebaseError = error as { code: string; message: string };
            if (firebaseError.code === "auth/email-already-exists") {
                return NextResponse.json(
                    { error: "A user with this email already exists" },
                    { status: 409 }
                );
            }
            if (firebaseError.code === "auth/invalid-email") {
                return NextResponse.json(
                    { error: "Invalid email address" },
                    { status: 400 }
                );
            }
        }

        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
