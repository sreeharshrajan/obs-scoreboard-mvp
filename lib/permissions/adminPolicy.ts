// lib/permissions/adminPolicy.ts
import { NextResponse } from "next/server";
import type { AuthContext } from "@/lib/types/auth";

export function enforceAdmin(auth: AuthContext) {
    if (!auth.roles.isAdmin) {
        return NextResponse.json(
            { error: "Forbidden: Admin access only" },
            { status: 403 }
        );
    }
    return null;
}
