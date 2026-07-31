// lib/permissions/superAdminPolicy.ts
import { NextResponse } from "next/server";
import type { AuthContext } from "@/lib/types/auth";

/**
 * Enforces super-admin access.
 * Super-admins can create staff users, assign matches,
 * reset passwords, and manage organizations.
 *
 * Returns null if the user is a super-admin,
 * or a 403 NextResponse otherwise.
 */
export function enforceSuperAdmin(auth: AuthContext) {
    if (!auth.roles.isSuperAdmin) {
        return NextResponse.json(
            { error: "Forbidden: Super-admin access only" },
            { status: 403 }
        );
    }
    return null;
}
