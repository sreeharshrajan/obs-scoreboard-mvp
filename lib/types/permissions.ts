// lib/types/permissions.ts
// ─────────────────────────────────────────────────
// Central type definitions for the permission system.
// These types are shared across server (resolvers, policies)
// and client (hooks, UI components).
// ─────────────────────────────────────────────────

/**
 * Raw permission booleans.
 * Used inside permission profiles and as the override shape on assignments.
 */
export type PermissionSet = {
  score: boolean;
  timer: boolean;
  broadcastSettings: boolean;  // overlay, sponsors, logos, graphics
  editMatch: boolean;          // player names, format, court, shuttle count
  manageTournament: boolean;
  manageUsers: boolean;
};

/**
 * Known permission profile template names.
 * Stored on `match_assignments.permissionProfile`.
 */
export type PermissionProfileName = "scorer" | "referee" | "broadcaster";

/**
 * Resolved permissions returned to the client.
 * Always versioned for future migration safety.
 */
export type MatchPermissions = {
  version: 1;
  canScore: boolean;
  canControlTimer: boolean;
  canAccessBroadcastSettings: boolean;
  canEditMatch: boolean;
  canDeleteMatch: boolean;
  canManageTournament: boolean;
  canManageUsers: boolean;
};

/**
 * Extended match permissions response — includes assignment context
 * so the UI can display who assigned this user and when,
 * without making additional requests.
 */
export type MatchPermissionsResponse = {
  permissions: MatchPermissions;
  assignment: {
    scope: "match" | "tournament" | "owner" | "superAdmin";
    permissionProfile: PermissionProfileName | "full";
    assignedBy: string | null;
    assignedAt: string | null;
  } | null;
};

/**
 * Shape of a document in the `match_assignments` Firestore collection.
 */
export type MatchAssignment = {
  id: string;
  organizationId: string;
  userId: string;
  tournamentId: string;
  matchId: string | null;           // null = tournament-wide scope
  scope: "match" | "tournament";
  permissionProfile: PermissionProfileName;
  permissionOverrides: Partial<PermissionSet> | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * User role stored in `users/{uid}.role`.
 * "organizer" = tournament owner / admin level
 * "staff"     = assigned operator (scorer, referee, etc.) — capabilities come from assignments
 * "viewer"    = read-only (future use)
 */
export type UserRole = "organizer" | "staff" | "viewer";
