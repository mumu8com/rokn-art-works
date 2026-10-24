import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "rokn_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function adminAuthConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && secret().length >= 32);
}

export function verifyAdminCredentials(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL || "";
  const expectedPassword = process.env.ADMIN_PASSWORD || "";
  if (!adminAuthConfigured() || !expectedEmail || !expectedPassword) return false;
  const emailA = Buffer.from(email.trim().toLowerCase());
  const emailB = Buffer.from(expectedEmail.trim().toLowerCase());
  const passA = Buffer.from(password);
  const passB = Buffer.from(expectedPassword);
  const emailMatch = emailA.length === emailB.length && timingSafeEqual(emailA, emailB);
  const passMatch = passA.length === passB.length && timingSafeEqual(passA, passB);
  return emailMatch && passMatch;
}

export function createAdminToken(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS })).toString("base64url");
  return payload + "." + sign(payload);
}

function validToken(token?: string) {
  if (!token || !secret()) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.email === process.env.ADMIN_EMAIL && Number(data.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function isAdminSessionValid() {
  const jar = await cookies();
  return validToken(jar.get(COOKIE_NAME)?.value);
}

export const adminCookie = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
};
