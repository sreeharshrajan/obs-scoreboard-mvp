"use server";

import { adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuth } from "firebase-admin/auth";

export async function updateUser(id: string, data: { displayName?: string; photoURL?: string; email?: string; role?: string }) {

    // Update Firestore
    await adminDb.collection("users").doc(id).update({
        ...data,
        updatedAt: new Date(),
    });

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
