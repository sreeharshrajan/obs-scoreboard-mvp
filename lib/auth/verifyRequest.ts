// lib/auth/verifyRequest.ts
import { adminAuth } from "@/lib/firebase/admin";
import { resolveRoles } from "@/lib/auth/roles";
import { memoryCache } from "@/lib/cache/memoryCache";
import type { AuthContext } from "@/lib/types/auth";

export async function verifyRequest(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.slice(7);
  // Cache key uses a slice of token to save memory
  const cacheKey = `auth:token:${token.slice(-32)}`;
  const cached = memoryCache.get<AuthContext>(cacheKey);
  if (cached) {
    return cached;
  }

  const decoded = await adminAuth.verifyIdToken(token);

  const authContext: AuthContext = {
    uid: decoded.uid,
    email: decoded.email ?? null,
    roles: resolveRoles(decoded.email ?? null),
  };

  // Cache token verification for 60 seconds (tokens are typically valid for 1 hour)
  memoryCache.set(cacheKey, authContext, 60000);

  return authContext;
}

