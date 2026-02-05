"use server";

import { adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuth } from "firebase-admin/auth";

export async function updateUser(token: string, id: string, data: { displayName?: string; photoURL?: string; email?: string; role?: string; streamerLogo?: string }) {

    // 1. Verify Token
    const decodedToken = await getAuth().verifyIdToken(token);
    const requestorId = decodedToken.uid;
    // Roles are now always admin, so we can skip complex checks or just rely on the new policy

    // 2. Authorization Check (Everyone is admin, but let's keep basic sanity check if needed, 
    // though the requirement is to remove permissions entirely. 
    // If "Everyone is admin", then anyone can edit anyone? 
    // "remove Role Permissions entirely" -> effectively yes, or at least self-edit is always allowed.
    // Let's assume broad access is fine as per "remove Role Permissions entirely".)

    // Update Firestore
    console.log(`[updateUser] Updating user ${id} with data:`, data);
    try {
        await adminDb.collection("users").doc(id).set({
            ...data,
            updatedAt: new Date(),
        }, { merge: true });
        console.log(`[updateUser] User ${id} updated successfully in Firestore.`);
    } catch (error) {
        console.error("[updateUser] Firestore update failed:", error);
        throw new Error("Database update failed");
    }

    // Update Firebase Auth (if name/image changed)
    try {
        if (data.displayName || data.photoURL !== undefined) {
            const updateParams: { displayName?: string; photoURL?: string | null } = {};
            if (data.displayName) updateParams.displayName = data.displayName;
            if (data.photoURL !== undefined) updateParams.photoURL = data.photoURL || null;

            if (Object.keys(updateParams).length > 0) {
                await getAuth().updateUser(id, updateParams);
            }
        }
    } catch (error) {
        console.error("Error updating Auth profile:", error);
        // Don't throw here, as DB update succeeded
    }

    revalidatePath(`/users`);
    revalidatePath(`/users/${id}/edit`);
    redirect(`/users`);
}
