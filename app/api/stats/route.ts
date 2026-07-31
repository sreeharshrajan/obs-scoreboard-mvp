// src/app/api/stats/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as admin from "firebase-admin";
import { adminDb } from "@/lib/firebase/admin";
import { resolveRoles } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/permissions";

export async function GET(req: Request) {
  try {
    let uid: string;
    let email: string | null = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const decoded = await admin.auth().verifyIdToken(token);
      uid = decoded.uid;
      email = decoded.email ?? null;
    } else {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("session")?.value;

      if (!sessionCookie) {
        return NextResponse.json(
          { success: false, error: "No session or token found" },
          { status: 401 }
        );
      }

      const decoded = await admin.auth().verifySessionCookie(sessionCookie, true);
      uid = decoded.uid;
      email = decoded.email ?? null;
    }

    const userDoc = await adminDb.collection("users").doc(uid).get();
    const dbRole = (userDoc.exists ? userDoc.data()?.role : null) as UserRole | null;
    const roles = resolveRoles(email, dbRole);

    if (roles.isStaff && !roles.isOrganizer && !roles.isSuperAdmin) {
      const assignmentsSnap = await adminDb
        .collection("match_assignments")
        .where("userId", "==", uid)
        .get();

      const assignedTournaments = new Set<string>();
      const assignedMatchIds = new Set<string>();
      let hasTournamentScope = false;

      assignmentsSnap.docs.forEach((doc) => {
        const d = doc.data();
        if (d.tournamentId) assignedTournaments.add(d.tournamentId);
        if (d.scope === "tournament") hasTournamentScope = true;
        if (d.matchId) assignedMatchIds.add(d.matchId);
      });

      let liveCount = 0;
      let completedCount = 0;

      for (const tournamentId of Array.from(assignedTournaments)) {
        const matchesSnap = await adminDb
          .collection("tournaments")
          .doc(tournamentId)
          .collection("matches")
          .get();

        matchesSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (hasTournamentScope || assignedMatchIds.has(doc.id)) {
            if (data.status === "live" || data.status === "in_progress") {
              liveCount++;
            } else if (data.status === "completed") {
              completedCount++;
            }
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          userTournaments: assignedTournaments.size,
          liveMatches: liveCount,
          completedMatches: completedCount,
        },
      });
    }

    const [
      tournamentsSnap,
      liveMatchesSnap,
      completedMatchesSnap,
    ] = await Promise.all([
      adminDb.collection("tournaments").where("ownerId", "==", uid).count().get(),
      adminDb.collection("matches").where("ownerId", "==", uid).where("status", "==", "live").count().get(),
      adminDb.collection("matches").where("ownerId", "==", uid).where("status", "==", "completed").count().get(),
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
