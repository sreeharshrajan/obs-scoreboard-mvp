"use server";

import { adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateTournament(id: string, data: Record<string, unknown>) {
    await adminDb.collection("tournaments").doc(id).update({
        ...data,
        updatedAt: new Date(),
    });
    revalidatePath(`/tournaments/${id}`);
    redirect(`/tournaments/${id}`);
}

export async function addMatch(tournamentId: string, matchData: Record<string, unknown>) {
    await adminDb
        .collection("tournaments")
        .doc(tournamentId)
        .collection("matches")
        .add({
            ...matchData,
            status: "scheduled",
            createdAt: new Date(),
        });
    revalidatePath(`/tournaments/${tournamentId}`);
    redirect(`/tournaments/${tournamentId}`);
}