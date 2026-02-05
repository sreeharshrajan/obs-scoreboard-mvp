"use server";

import { adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuth } from "firebase-admin/auth";

export async function updateProfile(token: string, data: { displayName?: string; photoURL?: string; streamerLogo?: string }) {
    // 1. Verify Token
    let decodedToken;
    try {
        decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
        console.error("Token verification failed:", error);
        throw new Error("Invalid authentication token");
    }

    const userId = decodedToken.uid;

    // 2. Update Firestore
    console.log(`[updateProfile] Updating user ${userId} with data:`, data);
    try {
        await adminDb.collection("users").doc(userId).set({
            ...data,
            updatedAt: new Date(),
        }, { merge: true });
        console.log(`[updateProfile] User ${userId} updated successfully in Firestore.`);
    } catch (error) {
        console.error("[updateProfile] Firestore update failed:", error);
        throw new Error("Database update failed");
    }

    // 3. Update Firebase Auth (if name/image changed)
    try {
        if (data.displayName || data.photoURL !== undefined) {
            const updateParams: { displayName?: string; photoURL?: string | null } = {};
            if (data.displayName) updateParams.displayName = data.displayName;
            if (data.photoURL !== undefined) updateParams.photoURL = data.photoURL || null;

            if (Object.keys(updateParams).length > 0) {
                await getAuth().updateUser(userId, updateParams);
            }
        }
    } catch (error) {
        console.error("Error updating Auth profile:", error);
        // Don't throw here, as DB update succeeded
    }

    revalidatePath(`/users`);
    revalidatePath(`/account`);

    // No redirect needed if we are already on the page, but let's encourage fresh state
    //redirect(`/account`); 
    // Actually, redirecting to the same page is fine to refresh server components
}
