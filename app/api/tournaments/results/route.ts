import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { memoryCache } from "@/lib/cache/memoryCache";

export async function GET() {
    try {
        // Fetch real-time completed tournaments or top results
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

        return NextResponse.json(results, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
            }
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}