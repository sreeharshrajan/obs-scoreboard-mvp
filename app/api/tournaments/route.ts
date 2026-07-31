import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: Request) {
  try {
    let auth;
    try {
      auth = await verifyRequest(request);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await adminDb.collection("tournaments").get();
    let docs = snapshot.docs;

    // Filter for staff users — only show tournaments they own or are assigned to
    if (auth.roles.isStaff && !auth.roles.isOrganizer && !auth.roles.isSuperAdmin) {
      const assignmentsSnap = await adminDb
        .collection("match_assignments")
        .where("userId", "==", auth.uid)
        .get();

      const assignedTournamentIds = new Set(
        assignmentsSnap.docs.map((doc) => doc.data().tournamentId)
      );

      docs = docs.filter(
        (doc) => doc.data().ownerId === auth.uid || assignedTournamentIds.has(doc.id)
      );
    }

    const tournaments = docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unnamed Tournament",
          location: data.location || "",
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          type: data.type || data.category || "Individual",
          category: data.category || data.type || "Individual",
          scoringType: data.scoringType || "Badminton",
          logo: data.logo || "",
          status: data.status || "Upcoming",
          ownerId: data.ownerId || "",
          createdAt: data.createdAt,
        };
      })
      .sort((a: any, b: any) => {
        const getTs = (val: any) => {
          if (!val) return 0;
          if (typeof val.toDate === "function") return val.toDate().getTime();
          if (val.seconds) return val.seconds * 1000;
          const parsed = new Date(val).getTime();
          return isNaN(parsed) ? 0 : parsed;
        };
        return getTs(b.createdAt) - getTs(a.createdAt);
      });

    return NextResponse.json(tournaments);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch tournaments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, location, startDate, endDate, type, logo, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const docRef = await adminDb.collection("tournaments").add({
      name,
      location,
      startDate,
      endDate,
      type,
      logo,
      ownerId: userId,
      status: "Upcoming",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, data: { id: docRef.id } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

