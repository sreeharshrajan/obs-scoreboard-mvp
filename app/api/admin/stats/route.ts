import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { resolveRoles } from "@/lib/auth/roles";
import { AdminStats, ApiResponse } from "@/lib/types/admin";
import { memoryCache } from "@/lib/cache/memoryCache";

export async function GET() {
  try {
    // 1️⃣ Read session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: "No session found" },
        { status: 401 }
      );
    }

    // 2️⃣ Verify session cookie (with memory caching to avoid remote network latency)
    const sessionCacheKey = `auth:session:${sessionCookie.slice(-32)}`;
    let decoded = memoryCache.get<{ email?: string; uid: string }>(sessionCacheKey);

    if (!decoded) {
      decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
      memoryCache.set(sessionCacheKey, { email: decoded.email, uid: decoded.uid }, 60000);
    }

    const { email } = decoded;
    const roles = resolveRoles(email ?? null);

    // 3️⃣ Admin verification logic
    if (!roles.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // 4️⃣ Live Realtime Stats (Direct from database, no stale caching)
    const [usersSnap, tournamentsSnap, matchesSnap] = await Promise.all([
      adminDb.collection("users").count().get(),
      adminDb.collection("tournaments").count().get(),
      adminDb.collectionGroup("matches").count().get(),
    ]);

    const stats: AdminStats = {
      totalUsers: usersSnap.data().count,
      activeTournaments: tournamentsSnap.data().count,
      totalMatches: matchesSnap.data().count,
    };

    const response: ApiResponse<AdminStats> = {
      success: true,
      data: stats,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: "Failed to fetch admin metrics",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

