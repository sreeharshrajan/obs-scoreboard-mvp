"use client";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { useRouter, usePathname } from "next/navigation";
import DashboardHeader from "@/components/dashboard/header";
import DashboardFooter from "@/components/dashboard/footer";
import PageHeader from "@/components/dashboard/page-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading, setUserProfile, clearProfile, user, loading, profile } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);

            if (!u) {
                clearProfile();
                setLoading(false);
                router.push("/signin");
                return;
            }

            // Fetch user profile for role-based access
            try {
                const token = await u.getIdToken();
                const res = await fetch(`/api/users/${u.uid}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();

                    // Resolve roles client-side from the profile data
                    const SUPER_ADMIN_EMAILS = new Set([
                        "sreeharshkrajan@gmail.com",
                        "devasishkuttamath@gmail.com",
                    ]);

                    const email = u.email || data.email || null;
                    const dbRole = data.role || null;
                    const isSuperAdmin = email ? SUPER_ADMIN_EMAILS.has(email) : false;
                    const isOrganizer = isSuperAdmin || dbRole === "organizer";
                    const isStaff = dbRole === "staff";

                    setUserProfile({
                        role: dbRole,
                        organizationId: data.organizationId || null,
                        isActive: data.isActive !== false,
                        mustChangePassword: data.mustChangePassword === true,
                        roles: {
                            isSuperAdmin,
                            isOrganizer,
                            isStaff,
                            isAdmin: isSuperAdmin || isOrganizer,
                        },
                    });
                }
            } catch (err) {
                console.error("[Layout] Failed to fetch user profile:", err);
            }

            setLoading(false);
        });
        return () => unsub();
    }, [setUser, setLoading, setUserProfile, clearProfile, router]);


    // Hide PageHeader on Match Console (Live)
    // Matches /tournaments/[id]/matches/[matchId] but NOT /new or /edit
    const isMatchConsole = pathname.includes("/matches/") && !pathname.endsWith("/new") && !pathname.endsWith("/edit");

    return (
        <div className="h-screen w-full flex flex-col bg-[#FDFDFD] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#EAEAEA] overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-hidden relative shadow-inner flex flex-col">
                {!isMatchConsole && <PageHeader />}
                <div className="flex-1 overflow-y-auto relative">
                    {children}
                </div>
            </main>
            <DashboardFooter />
        </div>
    );
}