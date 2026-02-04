import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
    try {
        // Fetch only completed tournaments or top results
        const snapshot = await adminDb
            .collection("tournaments")
            .where("status", "==", "completed")
            .limit(20)
            .get();

        const results = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                winner: data.winner || "TBD",
                endDate: data.endDate || data.startDate,
                category: data.category
            };
        });

        return NextResponse.json(results);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}