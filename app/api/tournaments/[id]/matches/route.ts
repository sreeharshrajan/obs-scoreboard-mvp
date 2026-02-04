import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const snapshot = await adminDb
            .collection("matches")
            .where("tournamentId", "==", id)
            .orderBy("createdAt", "desc")
            .get();

        const matches = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(matches);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch matches";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tournamentId } = await params;
        const body = await req.json();

        try {
            await verifyRequest(req);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const newMatch = {
            ...body,
            tournamentId,
            status: body.status || "scheduled",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb.collection("matches").add(newMatch);

        return NextResponse.json({ id: docRef.id, ...newMatch }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create match";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}