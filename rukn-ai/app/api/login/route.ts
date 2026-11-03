import { NextResponse } from "next/server";
import { createSession, sessionCookieName } from "@/lib/auth";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const expectedEmail = process.env.RUKN_ADMIN_EMAIL || "";
    const expectedPassword = process.env.RUKN_ADMIN_PASSWORD || "";
    if (!expectedEmail || !expectedPassword || !process.env.RUKN_SESSION_SECRET || process.env.RUKN_SESSION_SECRET.length < 32) {
      return NextResponse.json({ error: "admin_setup_required" }, { status: 503 });
    }
    const safeEqual = (a: string, b: string) => {
      const aa = Buffer.from(a);
      const bb = Buffer.from(b);
      return aa.length === bb.length && timingSafeEqual(aa, bb);
    };
    if (typeof email !== "string" || typeof password !== "string" || !safeEqual(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase()) || !safeEqual(password, expectedPassword)) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    const session = createSession(expectedEmail);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookieName, session.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: session.maxAge });
    return response;
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}