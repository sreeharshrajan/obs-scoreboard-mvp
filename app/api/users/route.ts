// app/api/users/route.ts
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { enforceAdmin } from "@/lib/permissions/adminPolicy";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { memoryCache } from "@/lib/cache/memoryCache";

export async function GET(req: Request) {
  try {
    const auth = await verifyRequest(req);

    const adminError = enforceAdmin(auth);
    if (adminError) return adminError;

    // 1. Check memory cache (60s TTL)
    const cacheKey = "admin:users:list";
    const cachedUsers = memoryCache.get<any[]>(cacheKey);
    if (cachedUsers) {
      return NextResponse.json(cachedUsers, {
        headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" }
      });
    }

    // 2. Fetch Auth Users & Firestore Profile Data in parallel
    const [authResult, snapshot] = await Promise.all([
      adminAuth.listUsers(1000),
      adminDb.collection("users").get(),
    ]);

    const dbUsersMap = new Map();
    snapshot.forEach(doc => {
      dbUsersMap.set(doc.id, doc.data());
    });

    // 3. Merge Data (Prioritize Firestore for profile fields)
    const users = authResult.users.map((user) => {
      const dbUser = dbUsersMap.get(user.uid) || {};

      const mergedUser = {
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
        ...dbUser, // include streamerLogo, etc
      };

      // Warm user cache for individual user / owner lookups
      memoryCache.set(`user:${user.uid}`, mergedUser, 60000);
      memoryCache.set(`user:profile:${user.uid}`, {
        id: user.uid,
        email: mergedUser.email,
        displayName: mergedUser.displayName,
        photoURL: mergedUser.photoURL,
      }, 300000);

      return mergedUser;
    });

    memoryCache.set(cacheKey, users, 60000);

    return NextResponse.json(users, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" }
    });
  } catch (error: unknown) {
    console.error("Fetch Users Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}