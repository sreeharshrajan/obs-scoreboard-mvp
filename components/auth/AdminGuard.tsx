// components/auth/AdminGuard.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { resolveRoles } from "@/lib/auth/roles";

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuthStore();
    const router = useRouter();
    const { isAdmin } = resolveRoles(user?.email || null);

    useEffect(() => {
        // If loading is finished and user is not an admin, redirect them
        if (!loading && !isAdmin) {
            router.push("/dashboard"); // Or a 403 page
        }
    }, [isAdmin, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-[#FF5A09] font-bold tracking-widest text-xs uppercase">
                    Verifying Permissions...
                </div>
            </div>
        );
    }

    // Only render children if user is Admin
    if (isAdmin) {
        return <>{children}</>;
    }

    return null;
}