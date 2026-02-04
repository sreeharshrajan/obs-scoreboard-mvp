import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";

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

        const doc = await adminDb.collection("matches").doc(id).get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * PATCH: Update match details (scores, status, court, etc.)
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

        const matchRef = adminDb.collection("matches").doc(id);
        const doc = await matchRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        // Update with timestamp
        await matchRef.update({
            ...body,
            updatedAt: new Date().toISOString(),
        });

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

        await adminDb.collection("matches").doc(id).delete();

        return NextResponse.json({ success: true, message: "Match deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}