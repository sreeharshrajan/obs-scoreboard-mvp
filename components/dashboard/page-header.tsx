"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, UserPlus } from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { resolveRoles } from "@/lib/auth/roles";

import { Skeleton } from "@/components/ui/skeleton";

export default function PageHeader() {
    const pathname = usePathname();
    const { user, loading } = useAuthStore();
    const { isAdmin } = resolveRoles(user?.email || null);

    const getHeaderInfo = () => {
        const parts = pathname.split('/').filter(Boolean);
        // parts[0] = app segment (users, tournaments, dashboard)

        // Users
        if (pathname === "/users") {
            return {
                title: "Platform Users",
                breadcrumbs: [
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Users", href: null }
                ],
                backUrl: null,
                action: {
                    label: "Add User",
                    href: "/users/new",
                    icon: UserPlus
                }
            };
        }
        if (pathname.includes("/users") && pathname.includes("/edit")) {
            return {
                title: "Edit Account",
                breadcrumbs: [
                    { label: "Users", href: "/users" },
                    { label: "User Management", href: null }
                ],
                backUrl: "/users",
                backLabel: "Users"
            };
        }

        // Tournaments
        if (pathname === "/tournaments") {
            return {
                title: "Your Tournaments",
                breadcrumbs: [
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Tournaments", href: null }
                ],
                backUrl: null,
                action: {
                    label: "Create New",
                    href: "/tournaments/new",
                    icon: Plus
                }
            };
        }
        if (pathname === "/tournaments/new") {
            return {
                title: "Create Tournament",
                breadcrumbs: [
                    { label: "Dashboard", href: `/dashboard` },
                    { label: "Tournaments", href: "/tournaments" },
                    { label: "New", href: null }
                ],
                backUrl: "/tournaments",
                backLabel: "Tournaments"
            };
        }

        // Dynamic Tournament Routes
        if (parts[0] === "tournaments" && parts[1] && parts[1] !== "new") {
            const tournamentId = parts[1];

            // /tournaments/[id]
            if (parts.length === 2) {
                return {
                    title: "Tournament Details",
                    breadcrumbs: [
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "Tournaments", href: "/tournaments" },
                        { label: "Details", href: null }
                    ],
                    backUrl: "/tournaments",
                    backLabel: "All Tournaments"
                };
            }

            // /tournaments/[id]/edit
            if (parts[2] === "edit") {
                return {
                    title: "Edit Tournament",
                    breadcrumbs: [
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "Tournaments", href: `/tournaments` },
                        { label: "Tournament Details", href: `/tournaments/${tournamentId}` },
                        { label: "Edit", href: null }
                    ],
                    backUrl: `/tournaments/${tournamentId}`,
                    backLabel: "Tournament Details"
                };
            }

            // /tournaments/[id]/matches/new
            if (parts[2] === "matches" && parts[3] === "new") {
                return {
                    title: "New Match",
                    breadcrumbs: [
                        { label: "Management", href: `/tournaments/${tournamentId}` },
                        { label: "Schedule", href: null }
                    ],
                    backUrl: `/tournaments/${tournamentId}`,
                    backLabel: "Tournament Details"
                };
            }

            // /tournaments/[id]/matches/[matchId]
            if (parts[2] === "matches" && parts[3]) {
                return {
                    title: "Match Control",
                    breadcrumbs: [
                        { label: "Management", href: `/tournaments/${tournamentId}` },
                        { label: "Live Console", href: null }
                    ],
                    backUrl: `/tournaments/${tournamentId}`,
                    backLabel: "Tournament Details"
                };
            }
        }

        // Account Settings
        if (pathname === "/account") {
            return {
                title: "Account Settings",
                breadcrumbs: [
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Account", href: null }
                ],
                backUrl: "/dashboard",
                backLabel: "Dashboard"
            };
        }

        // Dashboard (Default)
        if (pathname === "/dashboard" || pathname === "/") {
            const displayName = user?.displayName || (user?.email ? user.email.split("@")[0] : "User");
            return {
                title: `Hello, ${displayName}`,
                breadcrumbs: [
                    { label: "Overview", href: null }
                ],
                backUrl: null,
                action: !isAdmin ? {
                    label: "New Tournament",
                    href: "/tournaments/new",
                    icon: Plus
                } : null
            };
        }

        return null;
    };

    const info = getHeaderInfo();

    if (!info) return null;

    return (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-6 md:px-10 py-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="space-y-1">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 mb-1">
                    {info.breadcrumbs?.map((crumb, index) => (
                        <div key={index} className="flex items-center gap-2">
                            {index > 0 && <span className="text-slate-300 text-[10px] font-bold">/</span>}
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#FF5A09] transition-colors"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF5A09]">
                                    {crumb.label}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {loading ? (
                    <Skeleton className="h-10 w-64 rounded-xl" />
                ) : (
                    <h1 className="text-3xl md:text-4xl font-instrument font-medium tracking-tight text-slate-900 dark:text-white">
                        {info.title.includes(" ") ? (
                            <>
                                {info.title.split(" ")[0]}{" "}
                                <span className="italic font-light text-[#FF5A09]">
                                    {info.title.split(" ").slice(1).join(" ")}
                                </span>
                            </>
                        ) : (
                            info.title
                        )}
                        <span className="text-[#FF5A09]">.</span>
                    </h1>
                )}
            </div>

            <div className="hidden md:block flex items-center gap-3">
                {info.backUrl && (
                    <Link
                        href={info.backUrl}
                        className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-black dark:hover:text-white font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                        <ChevronLeft size={14} /> {info.backLabel}
                    </Link>
                )}

                {loading ? (
                    info.action && <Skeleton className="h-10 w-32 rounded-full" />
                ) : (
                    info.action && (
                        <Link
                            href={info.action.href}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-bold text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg active:scale-95"
                        >
                            {info.action.icon && <info.action.icon size={14} />} {info.action.label}
                        </Link>
                    )
                )}
            </div>
        </header>
    );
}
