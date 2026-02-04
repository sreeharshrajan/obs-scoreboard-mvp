import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        // 1. Await params first
        const { id } = await params;

        // 2. Auth check - Wrap in try/catch if verifyRequest throws
        try {
            await verifyRequest(req);
        } catch (authError) {
            console.error("Auth failed:", authError);
            // If you want to allow public viewing, don't return here. 
            // If it MUST be private, uncomment the next 4 lines:
            // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 3. Fetch tournament
        const doc = await adminDb.collection("tournaments").doc(id).get();

        if (!doc.exists) {
            return NextResponse.json(
                { error: "Tournament not found" },
                { status: 404 },
            );
        }

        const tournament = doc.data() || {};
        const ownerId = tournament.ownerId;

        // 4. Helper to serialize Firestore Timestamps safely
        const formatDate = (val: any) => {
            if (!val) return null;
            if (typeof val.toDate === 'function') return val.toDate().toISOString();
            return val;
        };

        let ownerData = null;
        if (ownerId) {
            try {
                const user = await getAuth().getUser(ownerId);
                ownerData = {
                    id: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                };
            } catch (userError) {
                console.warn("Owner not found in Auth:", userError);
            }
        }

        // 5. Explicitly return a clean object (prevents serialization crashes)
        return NextResponse.json({
            id: doc.id,
            name: tournament.name || "Unnamed Tournament",
            location: tournament.location || "",
            startDate: tournament.startDate || "",
            category: tournament.category || "",
            scoringType: tournament.scoringType || "",
            status: tournament.status || "draft",
            createdAt: formatDate(tournament.createdAt),
            owner: ownerData,
        });

    } catch (globalError: any) {
        console.error("Global API Error:", globalError);
        return NextResponse.json(
            { error: "Internal Server Error", details: globalError.message },
            { status: 500 }
        );
    }
}