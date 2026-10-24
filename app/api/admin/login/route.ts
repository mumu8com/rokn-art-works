import { NextResponse } from "next/server";
import { adminCookie, adminAuthConfigured, createAdminToken, verifyAdminCredentials } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!adminAuthConfigured()) {
    return NextResponse.json({ error: "لم تُضبط بيانات المدير في إعدادات الاستضافة بعد." }, { status: 503 });
  }
  let body: { email?: string; password?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 }); }
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (email.length > 254 || password.length > 1024 || !verifyAdminCredentials(email, password)) {
    return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, createAdminToken(email.trim().toLowerCase()), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", maxAge: adminCookie.maxAge,
  });
  return response;
}
