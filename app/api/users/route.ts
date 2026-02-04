// app/api/users/route.ts
import { getAuth } from "firebase-admin/auth";
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { enforceAdmin } from "@/lib/permissions/adminPolicy";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: Request) {
  try {
    const auth = await verifyRequest(req);

    const adminError = enforceAdmin(auth);
    if (adminError) return adminError;

    // 1. Fetch Auth Users
    const authResult = await getAuth().listUsers(1000);

    // 2. Fetch Firestore Profile Data
    const snapshot = await adminDb.collection("users").get();
    const dbUsersMap = new Map();
    snapshot.forEach(doc => {
      dbUsersMap.set(doc.id, doc.data());
    });
    console.log(`[API/Users] Fetched ${snapshot.size} users from Firestore.`);

    // 3. Merge Data (Prioritize Firestore for profile fields)
    const users = authResult.users.map((user) => {
      const dbUser = dbUsersMap.get(user.uid) || {};
      // Debug log for merged user
      if (dbUsersMap.has(user.uid)) {
        console.log(`[API/Users] Merging for ${user.uid}:`, {
          authPhoto: user.photoURL,
          dbPhoto: dbUser.photoURL,
          final: dbUser.photoURL || user.photoURL
        });
      }

      return {
        id: user.uid,
        email: dbUser.email || user.email,
        displayName: dbUser.displayName || user.displayName,
        photoURL: dbUser.photoURL || user.photoURL,
        role: dbUser.role || user.customClaims?.role || "User",
        disabled: user.disabled,
        emailVerified: user.emailVerified,
        createdAt: new Date(user.metadata.creationTime),
        lastLoginAt: user.metadata.lastSignInTime
          ? new Date(user.metadata.lastSignInTime)
          : null,
        providerData: user.providerData.map(p => p.providerId),
      };
    });

    return NextResponse.json(users);
  } catch (error: unknown) {
    console.error("Fetch Users Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}