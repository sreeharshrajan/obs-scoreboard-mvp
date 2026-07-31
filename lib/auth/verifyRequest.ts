// lib/auth/verifyRequest.ts
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebase/admin";
import { adminDb } from "@/lib/firebase/admin";
import { resolveRoles } from "@/lib/auth/roles";
import type { AuthContext } from "@/lib/types/auth";
import type { UserRole } from "@/lib/types/permissions";

export async function verifyRequest(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.slice(7);
  const decoded = await getAuth().verifyIdToken(token);

  // Fetch the Firestore user doc for role + isActive status
  const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
  const userData = userDoc.exists ? userDoc.data() : null;

  // Check if account is deactivated
  if (userData?.isActive === false) {
    throw new Error("Account deactivated");
  }

  const dbRole = (userData?.role as UserRole) ?? null;
  const organizationId = (userData?.organizationId as string) ?? null;

  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    roles: resolveRoles(decoded.email ?? null, dbRole),
    userRole: dbRole,
    organizationId,
  };
}

