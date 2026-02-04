"use server";

import { adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuth } from "firebase-admin/auth";

export async function updateUser(id: string, data: { displayName?: string; photoURL?: string; email?: string; role?: string }) {

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
