// lib/hooks/useMatchPermissions.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/firebase/client";
import type { MatchPermissionsResponse, MatchPermissions } from "@/lib/types/permissions";

/**
 * Default deny-all permissions — used while loading or on error.
 */
const DENY_ALL: MatchPermissions = {
    version: 1,
    canScore: false,
    canControlTimer: false,
    canAccessBroadcastSettings: false,
    canEditMatch: false,
    canDeleteMatch: false,
    canManageTournament: false,
    canManageUsers: false,
};

/**
 * Client-side hook to fetch the current user's permissions for a specific match.
 *
 * Returns the resolved MatchPermissions object + assignment metadata.
 * The UI uses this to make all permission decisions — no role checks in components.
 *
 * @param tournamentId - Tournament ID
 * @param matchId      - Match ID
 */
export function useMatchPermissions(tournamentId: string, matchId: string) {
    const { data, isLoading, isError } = useQuery<MatchPermissionsResponse>({
        queryKey: ["matchPermissions", tournamentId, matchId],
        queryFn: async () => {
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");

            const token = await user.getIdToken();
            const res = await fetch(
                `/api/tournaments/${tournamentId}/matches/${matchId}/permissions`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) {
                throw new Error("Failed to fetch permissions");
            }

            return res.json();
        },
        enabled: !!tournamentId && !!matchId,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        retry: 1,
    });

    return {
        permissions: data?.permissions ?? DENY_ALL,
        assignment: data?.assignment ?? null,
        isLoading,
        isError,
    };
}
