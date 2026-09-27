// src/app/api/stats/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { resolveRoles } from "@/lib/auth/roles";
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
    let decoded = memoryCache.get<{ uid: string; email?: string }>(sessionCacheKey);

    if (!decoded) {
      decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
      memoryCache.set(sessionCacheKey, { uid: decoded.uid, email: decoded.email }, 60000);
    }

    const { uid } = decoded;

    // 3️⃣ Realtime user tournament stats (No stale caching)
    const tournamentsSnap = await adminDb
      .collection("tournaments")
      .where("ownerId", "==", uid)
      .get();

    // Fetch matches across user's tournaments concurrently
    const matchSnaps = await Promise.all(
      tournamentsSnap.docs.map(t => t.ref.collection("matches").get())
    );

    let liveMatches = 0;
    let completedMatches = 0;

    for (const snap of matchSnaps) {
      for (const doc of snap.docs) {
        const s = doc.data().status;
        if (s === "live" || s === "in_progress") {
          liveMatches++;
        } else if (s === "completed") {
          completedMatches++;
        }
      }
    }

    const statsData = {
      userTournaments: tournamentsSnap.size,
      liveMatches,
      completedMatches,
    };

    return NextResponse.json({
      success: true,
      data: statsData,
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      }
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed or server error" },
      { status: 401 }
    );
  }
}

