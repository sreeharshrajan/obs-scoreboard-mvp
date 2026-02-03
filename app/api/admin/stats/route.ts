import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { AdminStats, ApiResponse } from "@/lib/types/admin";

export async function GET() {
  try {
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
