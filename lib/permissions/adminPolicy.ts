// lib/permissions/adminPolicy.ts
import { NextResponse } from "next/server";
import type { AuthContext } from "@/lib/types/auth";

export function enforceAdmin(auth: AuthContext) {
    // Everyone is an admin now
    return null;
}
