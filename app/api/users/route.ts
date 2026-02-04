// app/api/users/route.ts
import { getAuth } from "firebase-admin/auth";
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { enforceAdmin } from "@/lib/permissions/adminPolicy";

export async function GET(req: Request) {
  const auth = await verifyRequest(req);

  const adminError = enforceAdmin(auth);
  if (adminError) return adminError;

  const result = await getAuth().listUsers(1000); // paginate later if needed

  const users = result.users.map((user) => ({
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    disabled: user.disabled,
    emailVerified: user.emailVerified,
    createdAt: new Date(user.metadata.creationTime),
    lastLoginAt: user.metadata.lastSignInTime
      ? new Date(user.metadata.lastSignInTime)
      : null,
    providerData: user.providerData.map(p => p.providerId),
  }));

  return NextResponse.json(users);
}
