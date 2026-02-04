
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";

/**
 * Helper to find a match document reference by ID across all tournaments
 */
async function findMatchDoc(matchId: string) {
    const snapshot = await adminDb.collectionGroup("matches").get();
    const doc = snapshot.docs.find((d) => d.id === matchId);
    return doc || null;
}

/**
 * GET: Fetch a single match by ID
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        try {
            await verifyRequest(req);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doc = await findMatchDoc(id);

        if (!doc || !doc.exists) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * PATCH: Update match details
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        try {
            await verifyRequest(req);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doc = await findMatchDoc(id);

        if (!doc) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        await doc.ref.set({
            ...body,
            updatedAt: new Date().toISOString(),
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * DELETE: Remove a match
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        try {
            await verifyRequest(req);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doc = await findMatchDoc(id);

        if (!doc) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        await doc.ref.delete();

        return NextResponse.json({ success: true, message: "Match deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}