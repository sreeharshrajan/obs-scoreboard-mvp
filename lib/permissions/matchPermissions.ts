// lib/permissions/matchPermissions.ts
// ─────────────────────────────────────────────────
// Central permission resolver for match-level access.
//
// This is the ONLY place permission decisions are made.
// API routes and UI components consume the resolved
// MatchPermissions / MatchPermissionsResponse — they
// never inspect role strings directly.
// ─────────────────────────────────────────────────

import { adminDb } from "@/lib/firebase/admin";
import { FULL_PERMISSIONS, resolveProfilePermissions } from "@/lib/permissions/profiles";
import type { AuthContext } from "@/lib/types/auth";
import type {
  MatchPermissions,
  MatchPermissionsResponse,
  PermissionProfileName,
  PermissionSet,
} from "@/lib/types/permissions";

// ─── Request-scoped cache ────────────────────────
// Avoids re-querying Firestore when the same request
// needs permissions for the same user/match multiple times.
const resolverCache = new WeakMap<Request, Map<string, MatchPermissionsResponse>>();

function getCacheKey(uid: string, tournamentId: string, matchId: string): string {
  return `${uid}:${tournamentId}:${matchId}`;
}

// ─── Resolver ────────────────────────────────────

function permissionSetToMatchPermissions(p: PermissionSet): MatchPermissions {
  return {
    version: 1,
    canScore: p.score,
    canControlTimer: p.timer,
    canAccessBroadcastSettings: p.broadcastSettings,
    canEditMatch: p.editMatch,
    canDeleteMatch: p.editMatch && p.manageTournament,
    canManageTournament: p.manageTournament,
    canManageUsers: p.manageUsers,
  };
}

/**
 * Resolve the effective permissions a user has on a specific match.
 *
 * Resolution order:
 *   1. Super-admins and organizers → full access
 *   2. Staff users → query `match_assignments` for:
 *      a. Exact match assignment (scope = "match")
 *      b. Tournament-wide assignment (scope = "tournament", matchId = null)
 *   3. If no assignment found → deny everything
 *
 * Tournament-wide assignments automatically inherit to future matches,
 * regenerated fixtures, and knockout rounds — no action needed when
 * matches are created or restructured.
 *
 * @param auth          - Authenticated user context from verifyRequest
 * @param tournamentId  - Tournament ID
 * @param matchId       - Match ID
 * @param req           - Optional Request object for request-scoped caching
 */
export async function resolveMatchPermissions(
  auth: AuthContext,
  tournamentId: string,
  matchId: string,
  req?: Request
): Promise<MatchPermissionsResponse> {
  // ── Cache check ──
  if (req) {
    const cache = resolverCache.get(req);
    const key = getCacheKey(auth.uid, tournamentId, matchId);
    if (cache?.has(key)) {
      return cache.get(key)!;
    }
  }

  let result: MatchPermissionsResponse;

  // ── Super-admins and organizers: full access ──
  if (auth.roles.isSuperAdmin || auth.roles.isOrganizer) {
    result = {
      permissions: permissionSetToMatchPermissions(FULL_PERMISSIONS),
      assignment: {
        scope: auth.roles.isSuperAdmin ? "superAdmin" : "owner",
        permissionProfile: "full",
        assignedBy: null,
        assignedAt: null,
      },
    };
  } else {
    // ── Check if user is the tournament owner ──
    const tournamentDoc = await adminDb.collection("tournaments").doc(tournamentId).get();
    if (tournamentDoc.exists && tournamentDoc.data()?.ownerId === auth.uid) {
      result = {
        permissions: permissionSetToMatchPermissions(FULL_PERMISSIONS),
        assignment: {
          scope: "owner",
          permissionProfile: "full",
          assignedBy: null,
          assignedAt: null,
        },
      };
    } else {
      // ── Staff: query match_assignments ──
      result = await resolveStaffPermissions(auth.uid, tournamentId, matchId);
    }
  }

  // ── Cache store ──
  if (req) {
    if (!resolverCache.has(req)) {
      resolverCache.set(req, new Map());
    }
    resolverCache.get(req)!.set(
      getCacheKey(auth.uid, tournamentId, matchId),
      result
    );
  }

  return result;
}

/**
 * Query match_assignments for a staff user.
 * Checks exact match first, then tournament-scope fallback.
 */
async function resolveStaffPermissions(
  userId: string,
  tournamentId: string,
  matchId: string
): Promise<MatchPermissionsResponse> {
  const assignmentsRef = adminDb.collection("match_assignments");

  // 1. Check for exact match assignment
  const exactSnap = await assignmentsRef
    .where("userId", "==", userId)
    .where("tournamentId", "==", tournamentId)
    .where("matchId", "==", matchId)
    .where("scope", "==", "match")
    .limit(1)
    .get();

  if (!exactSnap.empty) {
    const doc = exactSnap.docs[0];
    const data = doc.data();
    return buildResponseFromAssignment(data);
  }

  // 2. Check for tournament-wide assignment
  const tournamentSnap = await assignmentsRef
    .where("userId", "==", userId)
    .where("tournamentId", "==", tournamentId)
    .where("scope", "==", "tournament")
    .limit(1)
    .get();

  if (!tournamentSnap.empty) {
    const doc = tournamentSnap.docs[0];
    const data = doc.data();
    return buildResponseFromAssignment(data);
  }

  // 3. No assignment → deny all
  return {
    permissions: permissionSetToMatchPermissions({
      score: false,
      timer: false,
      broadcastSettings: false,
      editMatch: false,
      manageTournament: false,
      manageUsers: false,
    }),
    assignment: null,
  };
}

function buildResponseFromAssignment(
  data: FirebaseFirestore.DocumentData
): MatchPermissionsResponse {
  const profileName = data.permissionProfile as PermissionProfileName;
  const overrides = data.permissionOverrides ?? null;
  const resolved = resolveProfilePermissions(profileName, overrides);

  // Format timestamps safely
  const formatTimestamp = (val: unknown): string | null => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (val && typeof val === "object" && "toDate" in val) {
      return (val as { toDate: () => Date }).toDate().toISOString();
    }
    return null;
  };

  return {
    permissions: permissionSetToMatchPermissions(resolved),
    assignment: {
      scope: data.scope,
      permissionProfile: profileName,
      assignedBy: data.createdBy ?? null,
      assignedAt: formatTimestamp(data.createdAt),
    },
  };
}

// ─── Convenience guards for API routes ───────────

/**
 * Returns true if the user can update scores for this match.
 */
export async function canScoreMatch(
  auth: AuthContext,
  tournamentId: string,
  matchId: string,
  req?: Request
): Promise<boolean> {
  const { permissions } = await resolveMatchPermissions(auth, tournamentId, matchId, req);
  return permissions.canScore;
}

/**
 * Returns true if the user can control the timer for this match.
 */
export async function canControlTimer(
  auth: AuthContext,
  tournamentId: string,
  matchId: string,
  req?: Request
): Promise<boolean> {
  const { permissions } = await resolveMatchPermissions(auth, tournamentId, matchId, req);
  return permissions.canControlTimer;
}

/**
 * Returns true if the user can modify broadcast settings for this match.
 */
export async function canAccessBroadcastSettings(
  auth: AuthContext,
  tournamentId: string,
  matchId: string,
  req?: Request
): Promise<boolean> {
  const { permissions } = await resolveMatchPermissions(auth, tournamentId, matchId, req);
  return permissions.canAccessBroadcastSettings;
}

/**
 * Returns true if the user can edit match details (player names, format, etc.).
 */
export async function canEditMatch(
  auth: AuthContext,
  tournamentId: string,
  matchId: string,
  req?: Request
): Promise<boolean> {
  const { permissions } = await resolveMatchPermissions(auth, tournamentId, matchId, req);
  return permissions.canEditMatch;
}
