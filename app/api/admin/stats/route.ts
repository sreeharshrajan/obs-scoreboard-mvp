import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as admin from "firebase-admin";
import { adminDb } from "@/lib/firebase/admin";
import { resolveRoles } from "@/lib/auth/roles";
import { AdminStats, ApiResponse } from "@/lib/types/admin";

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

    const { email } = decoded;
    const roles = resolveRoles(email ?? null);

    // 3️⃣ Admin verification logic
    if (!roles.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const [usersSnap, tournamentsSnap, matchesSnap] = await Promise.all([
      adminDb.collection("users").count().get(),
      adminDb.collection("tournaments").count().get(),
      adminDb.collection("matches").count().get(),
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

    return NextResponse.json(response);
  } catch (error) {
    console.error("Admin Stats Error:", error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: "Failed to fetch admin metrics",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
