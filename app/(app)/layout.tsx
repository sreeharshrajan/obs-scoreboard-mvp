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
    const { setUser, setLoading, user, loading } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
            if (!u) router.push("/signin");
        });
        return () => unsub();
    }, [setUser, setLoading, router]);


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