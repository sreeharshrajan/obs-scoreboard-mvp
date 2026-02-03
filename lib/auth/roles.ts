// lib/auth/roles.ts
const ADMIN_EMAILS = new Set([
  "sreeharshkrajan@gmail.com",
]);

export function resolveRoles(email: string | null) {
  return {
    isAdmin: email ? ADMIN_EMAILS.has(email) : false,
  };
}
