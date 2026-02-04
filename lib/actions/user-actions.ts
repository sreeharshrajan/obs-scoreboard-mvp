"use server";

import { adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuth } from "firebase-admin/auth";

export async function updateUser(token: string, id: string, data: { displayName?: string; photoURL?: string; email?: string; role?: string }) {

    // 1. Verify Token
    const decodedToken = await getAuth().verifyIdToken(token);
    const requestorId = decodedToken.uid;
    const { isAdmin } = await import("@/lib/auth/roles").then(m => m.resolveRoles(decodedToken.email || null));

    // 2. Authorization Check (Must be Admin OR formatting their own profile)
    if (requestorId !== id && !isAdmin) {
        throw new Error("Unauthorized: You can only edit your own profile.");
    }

    // Prevent non-admins from changing their role
    if (data.role && !isAdmin && data.role !== "User") { // Simplification: Non-admins can't change role at all ideally, or we blindly trust input? 
        // Safer: If not admin, remove 'role' from data before updating
        delete data.role;
    }

    // Update Firestore
    console.log(`[updateUser] Updating user ${id} with data:`, data);
    await adminDb.collection("users").doc(id).set({
        ...data,
        updatedAt: new Date(),
    }, { merge: true });
    console.log(`[updateUser] User ${id} updated successfully in Firestore.`);

    // Update Firebase Auth (if name/image changed)
    try {
        if (data.displayName || data.photoURL) {
            await getAuth().updateUser(id, {
                displayName: data.displayName,
                photoURL: data.photoURL,
            });
        }
    } catch (error) {
        console.error("Error updating Auth profile:", error);
    }

    revalidatePath(`/users`);
    revalidatePath(`/users/${id}/edit`);
    redirect(`/users`);
}
