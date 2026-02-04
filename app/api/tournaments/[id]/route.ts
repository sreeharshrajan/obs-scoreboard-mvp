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

        // 1. Auth check
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

        // 3. Helper to serialize Timestamps
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
            endDate: tournament.endDate || "",
            type: tournament.type || tournament.category || "Individual",
            logo: tournament.logo || "",
            status: tournament.status || "draft",
            createdAt: formatDate(tournament.createdAt),
            owner: ownerData,
        });

    } catch (globalError: unknown) {
        const message = globalError instanceof Error ? globalError.message : "Internal Server Error";
        console.error("Global API Error:", globalError);

        return NextResponse.json(
            { error: "Internal Server Error", details: message },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await req.json();

        // 1. Auth check
        try {
            await verifyRequest(req);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Validate Tournament Exists
        const docRef = adminDb.collection("tournaments").doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        // 3. Update fields
        // Only allow updating specific fields
        const { name, location, startDate, endDate, type, logo, status } = body;

        const updates: any = {
            updatedAt: new Date(),
        };

        if (name) updates.name = name;
        if (location) updates.location = location;
        if (startDate) updates.startDate = startDate;
        if (endDate) updates.endDate = endDate;
        if (type) updates.type = type; // Map to type
        if (logo) updates.logo = logo;
        if (status) updates.status = status;

        await docRef.update(updates);

        return NextResponse.json({ success: true, message: "Tournament updated successfully" });

    } catch (error: any) {
        console.error("Update API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}