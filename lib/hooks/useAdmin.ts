import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { resolveRoles } from "@/lib/auth/roles";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";

export function useAdmin(redirectTo: string | null = "/login") {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        // resolveRoles returns { isAdmin: boolean }
        const roles = resolveRoles(user.email);
        const adminStatus = roles.isAdmin; 
        
        setIsAdmin(adminStatus);

        // If a redirect path is provided and user is NOT an admin
        if (!adminStatus && redirectTo) {
          router.push(redirectTo);
        }
      } else {
        setIsAdmin(false);
        if (redirectTo) {
          router.push(redirectTo);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, redirectTo]);

  return { isAdmin, loading };
}