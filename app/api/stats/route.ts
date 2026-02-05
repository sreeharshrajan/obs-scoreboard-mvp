// src/app/api/stats/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as admin from "firebase-admin";
import { adminDb } from "@/lib/firebase/admin";
import { resolveRoles } from "@/lib/auth/roles";

export async function GET() {
  try {
    // 1️⃣ Read session cookie (Next.js 15+)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: "No session found" },
        { status: 401 }
      );
    }

    // 2️⃣ Verify session cookie
    const decoded = await admin
      .auth()
      .verifySessionCookie(sessionCookie, true);

    const { uid, email } = decoded;
    const roles = resolveRoles(email ?? null);

    // 3️⃣ Admin verification logic
    // Removed strict admin check to allow regular users to access their own stats
    /* if (!roles.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    } */

    // 4️⃣ Fetch stats (Firestore count aggregation)
    const [
      tournamentsSnap,
      liveMatchesSnap,
      completedMatchesSnap,
    ] = await Promise.all([
      adminDb
        .collection("tournaments")
        .where("ownerId", "==", uid)
        .count()
        .get(),

      adminDb
        .collection("matches")
        .where("ownerId", "==", uid)
        .where("status", "==", "live")
        .count()
        .get(),

      adminDb
        .collection("matches")
        .where("ownerId", "==", uid)
        .where("status", "==", "completed")
        .count()
        .get(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        userTournaments: tournamentsSnap.data().count,
        liveMatches: liveMatchesSnap.data().count,
        completedMatches: completedMatchesSnap.data().count,
      },
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed or server error" },
      { status: 401 }
    );
  }
}
