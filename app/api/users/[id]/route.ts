// app/api/users/[id]/route.ts
import { getAuth } from "firebase-admin/auth";
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { enforceAdmin } from "@/lib/permissions/adminPolicy";

// GET: Fetch single user by ID
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyRequest(req);

        // Ensure requestor is admin (or potentially the user themselves, but enforceAdmin locks to admin for now)
        const adminError = enforceAdmin(auth);
        if (adminError) return adminError;

        const { id } = await params;
        if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

        const user = await getAuth().getUser(id);

        return NextResponse.json({
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: user.customClaims?.role || "User",
            createdAt: user.metadata.creationTime,
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

        await getAuth().deleteUser(id);

        return NextResponse.json({ success: true, message: "User deleted successfully" });
    } catch (error: unknown) {
        // Standard practice: check if it's an instance of Error
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";

        console.error("Delete User Error:", error);

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}