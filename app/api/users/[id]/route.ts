// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { enforceAdmin } from "@/lib/permissions/adminPolicy";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { memoryCache } from "@/lib/cache/memoryCache";

// GET: Fetch single user by ID
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyRequest(req);

        // Ensure requestor is admin OR the user themselves
        const adminError = enforceAdmin(auth);
        const { id } = await params;

        // If not admin and not requesting own data, block
        if (adminError && auth.uid !== id) {
            return adminError; // Return the 403 from enforceAdmin
        }
        if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

        const cacheKey = `user:${id}`;
        const cachedUser = memoryCache.get(cacheKey);
        if (cachedUser) {
            return NextResponse.json(cachedUser, {
                headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" }
            });
        }

        // Fetch Auth User & Firestore Data in parallel
        const [userRecord, userDoc] = await Promise.all([
            adminAuth.getUser(id),
            adminDb.collection("users").doc(id).get()
        ]);

        const userData = userDoc.exists ? userDoc.data() : {};

        const responsePayload = {
            id: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            role: userRecord.customClaims?.role || "User",
            createdAt: userRecord.metadata.creationTime,
            ...userData, // Merge Firestore data (streamerLogo, etc)
        };

        memoryCache.set(cacheKey, responsePayload, 60000);

        return NextResponse.json(responsePayload, {
            headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" }
        });

    } catch (error: unknown) {
        console.error("Fetch User Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyRequest(req);

        const adminError = enforceAdmin(auth);
        if (adminError) return adminError;

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        if (auth.uid === id) {
            return NextResponse.json({ error: "You cannot delete your own account." }, { status: 403 });
        }

        await adminAuth.deleteUser(id);

        memoryCache.invalidate(`user:${id}`);
        memoryCache.invalidate("admin:users");

        return NextResponse.json({ success: true, message: "User deleted successfully" });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Delete User Error:", error);

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}