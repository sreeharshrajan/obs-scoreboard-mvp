// lib/auth/verifyRequest.ts
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebase/admin";
import { resolveRoles } from "@/lib/auth/roles";
import type { AuthContext } from "@/lib/types/auth";

export async function verifyRequest(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.slice(7);
  const decoded = await getAuth().verifyIdToken(token);

  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    roles: resolveRoles(decoded.email ?? null),
  };
}
