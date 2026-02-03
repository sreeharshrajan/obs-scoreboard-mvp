import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days (ms)

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // ✅ MUST await in Route Handlers
    const cookieStore = await cookies();

    cookieStore.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000, // seconds
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("SESSION COOKIE ERROR:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
