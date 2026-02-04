import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ApiResponse } from "@/lib/types/admin";
import { FieldValue } from "firebase-admin/firestore";

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
