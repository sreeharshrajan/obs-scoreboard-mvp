// hooks/useAdmin.ts
import { useAuth } from "@/context/AuthContext"; // Assuming you have an AuthContext
import { resolveRoles } from "@/lib/auth/roles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAdminGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const roles = resolveRoles(user?.email ?? null);

  useEffect(() => {
    if (!loading && (!user || !roles.isAdmin)) {
      router.push("/dashboard");
    }
  }, [user, loading, roles.isAdmin, router]);

  return { isAdmin: roles.isAdmin, loading };
}