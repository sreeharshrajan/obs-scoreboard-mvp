import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin"; // Use the admin instance
import { cookies } from "next/headers";

export async function GET() {
  try {
    // 1. Next.js 15+ requires awaiting cookies()
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { data: null, error: "No session found" },
        { status: 401 },
      );
    }

    // 2. Use the admin auth service
    // Make sure your admin.ts calls initializeApp() before this runs
    const decodedToken = await admin
      .auth()
      .verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // 3. Fetch counts using the optimized .count() method
    const [tourneysSnap, liveMatchesSnap, completedMatchesSnap] =
      await Promise.all([
        adminDb
          .collection("tournaments")
          .where("ownerId", "==", userId)
          .count()
          .get(),
        adminDb
          .collection("matches")
          .where("ownerId", "==", userId)
          .where("status", "==", "live")
          .count()
          .get(),
        adminDb
          .collection("matches")
          .where("ownerId", "==", userId)
          .where("status", "==", "completed")
          .count()
          .get(),
      ]);

    const stats = {
      userTournaments: tourneysSnap.data().count,
      liveMatches: liveMatchesSnap.data().count,
      completedMatches: completedMatchesSnap.data().count,
    };

    // Note: NextResponse.json already sets the status, no need for status: 200 in the body
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed or server error" },
      { status: 401 },
    );
  }
}
