import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        // 1. Auth check - Catch block changed to omit unused variable
        try {
            await verifyRequest(req);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Fetch tournament
        const doc = await adminDb.collection("tournaments").doc(id).get();

        if (!doc.exists) {
            return NextResponse.json(
                { error: "Tournament not found" },
                { status: 404 },
            );
        }

        const tournament = doc.data() || {};
        const ownerId = tournament.ownerId;

        // 3. Helper to serialize Timestamps (Replaced 'any' with 'unknown')
        const formatDate = (val: unknown): string | null => {
            if (!val) return null;
            if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
                return (val as { toDate: () => Date }).toDate().toISOString();
            }
            return typeof val === 'string' ? val : null;
        };

        let ownerData = null;
        if (ownerId && typeof ownerId === 'string') {
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

    } catch (globalError: unknown) {
        // Handle global error without 'any'
        const message = globalError instanceof Error ? globalError.message : "Internal Server Error";
        console.error("Global API Error:", globalError);

        return NextResponse.json(
            { error: "Internal Server Error", details: message },
            { status: 500 }
        );
    }
}