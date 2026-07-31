// lib/permissions/adminPolicy.ts
import { NextResponse } from "next/server";
import type { AuthContext } from "@/lib/types/auth";

/**
 * Enforces organizer-level access (organizers + super-admins).
 * Used for tournament management, match creation, and similar operations.
 */
export function enforceOrganizer(auth: AuthContext) {
    if (!auth.roles.isOrganizer) {
        return NextResponse.json(
            { error: "Forbidden: Organizer access required" },
            { status: 403 }
        );
    }
    return null;
}

/**
 * @deprecated Use `enforceOrganizer` instead.
 * Kept for backwards compatibility during migration.
 */
export function enforceAdmin(auth: AuthContext) {
    if (!auth.roles.isAdmin) {
        return NextResponse.json(
            { error: "Forbidden: Admin access only" },
            { status: 403 }
        );
    }
    return null;
}

