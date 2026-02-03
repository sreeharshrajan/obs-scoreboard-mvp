// app/api/users/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { enforceAdmin } from "@/lib/permissions/adminPolicy";

export async function GET(req: Request) {
  const auth = await verifyRequest(req);

  const adminError = enforceAdmin(auth);
  if (adminError) return adminError;

  const snapshot = await adminDb.collection("users").get();
  const users = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json(users);
}
