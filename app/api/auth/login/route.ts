import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { resolveRoles } from "@/lib/auth/roles";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/types/permissions";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    // 1. Verify the Firebase ID token
    const decoded = await adminAuth.verifyIdToken(idToken);

    // 2. Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days (ms)

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // ✅ MUST await in Route Handlers
    const cookieStore = await cookies();

    cookieStore.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000, // seconds
    });

    // 3. Fetch user profile from Firestore for centralized auth bootstrap
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const dbRole = (userData?.role as UserRole) ?? null;
    const roles = resolveRoles(decoded.email ?? null, dbRole);

    // 4. Update lastLoginAt
    if (userDoc.exists) {
      await adminDb.collection("users").doc(decoded.uid).update({
        lastLoginAt: new Date(),
      });
    }

    // 5. Return profile alongside success — no extra round trip needed
    return NextResponse.json({
      success: true,
      user: {
        uid: decoded.uid,
        email: decoded.email ?? null,
        displayName: userData?.displayName ?? decoded.name ?? null,
        photoURL: userData?.photoURL ?? decoded.picture ?? null,
        role: dbRole,
        organizationId: userData?.organizationId ?? null,
        isActive: userData?.isActive !== false,
        mustChangePassword: userData?.mustChangePassword === true,
        roles: {
          isSuperAdmin: roles.isSuperAdmin,
          isOrganizer: roles.isOrganizer,
          isStaff: roles.isStaff,
          isAdmin: roles.isAdmin,
        },
      },
    });
  } catch (error: any) {
    console.error("SESSION COOKIE ERROR:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

