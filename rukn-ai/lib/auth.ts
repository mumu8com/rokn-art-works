import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "rukn_session";
const ttlSeconds = 60 * 60 * 8;

function signature(payload: string) {
  const secret = process.env.RUKN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("RUKN_SESSION_SECRET must be at least 32 characters");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSession(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString("base64url");
  return { value: payload + "." + signature(payload), maxAge: ttlSeconds };
}

export function verifySession(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const raw = cookieHeader.split(";").map(v => v.trim()).find(v => v.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
    if (!raw) return false;
    const [payload, supplied] = raw.split(".");
    if (!payload || !supplied) return false;
    const expected = signature(payload);
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof data.email === "string" && data.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

export const sessionCookieName = COOKIE;
