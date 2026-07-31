// lib/auth/roles.ts
import type { UserRole } from "@/lib/types/permissions";

/**
 * Emails with super-admin privileges.
 * Super-admins can create staff users, assign matches,
 * reset passwords, and manage organizations.
 */
const SUPER_ADMIN_EMAILS = new Set([
  "sreeharshkrajan@gmail.com",
  "devasishkuttamath@gmail.com",
]);

export { SUPER_ADMIN_EMAILS };

/**
 * Resolve role flags from email + optional Firestore role.
 *
 * @param email   - User email from Firebase Auth token
 * @param dbRole  - Role value from Firestore `users/{uid}.role` (null if doc missing)
 */
export function resolveRoles(
  email: string | null,
  dbRole?: UserRole | null
) {
  const isSuperAdmin = email ? SUPER_ADMIN_EMAILS.has(email) : false;
  const isOrganizer = isSuperAdmin || dbRole === "organizer";
  const isStaff = dbRole === "staff";

  return {
    isSuperAdmin,
    isOrganizer,
    isStaff,
    /** @deprecated Use isSuperAdmin || isOrganizer */
    isAdmin: isSuperAdmin || isOrganizer,
  };
}
