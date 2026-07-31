// lib/permissions/profiles.ts
// ─────────────────────────────────────────────────
// Permission profile templates.
//
// Each profile defines default permissions for a staff role.
// Assignments store a `permissionProfile` key and optional
// `permissionOverrides` that patch the template per-assignment.
// ─────────────────────────────────────────────────

import type { PermissionSet, PermissionProfileName } from "@/lib/types/permissions";

/**
 * Server-side permission templates.
 *
 * To add a new staff role:
 *   1. Add the profile name to `PermissionProfileName` in types/permissions.ts
 *   2. Add a template entry here
 *
 * No other code changes are needed — the permission resolver
 * and UI both consume the resolved MatchPermissions object.
 */
export const PERMISSION_PROFILES: Record<PermissionProfileName, PermissionSet> = {
  scorer: {
    score: true,
    timer: true,
    broadcastSettings: true,
    editMatch: false,
    manageTournament: false,
    manageUsers: false,
  },
  referee: {
    score: true,
    timer: true,
    broadcastSettings: false,
    editMatch: true,
    manageTournament: false,
    manageUsers: false,
  },
  broadcaster: {
    score: false,
    timer: false,
    broadcastSettings: true,
    editMatch: false,
    manageTournament: false,
    manageUsers: false,
  },
};

/**
 * Full-access permission set used for super-admins and organizers.
 * Kept separate from profiles since it isn't a staff assignment profile.
 */
export const FULL_PERMISSIONS: PermissionSet = {
  score: true,
  timer: true,
  broadcastSettings: true,
  editMatch: true,
  manageTournament: true,
  manageUsers: true,
};

/**
 * Resolve effective permissions for an assignment by applying
 * optional overrides on top of the profile template.
 */
export function resolveProfilePermissions(
  profileName: PermissionProfileName,
  overrides?: Partial<PermissionSet> | null
): PermissionSet {
  const base = PERMISSION_PROFILES[profileName];
  if (!base) {
    // Unknown profile — deny everything
    return {
      score: false,
      timer: false,
      broadcastSettings: false,
      editMatch: false,
      manageTournament: false,
      manageUsers: false,
    };
  }

  if (!overrides) return { ...base };
  return { ...base, ...overrides };
}
