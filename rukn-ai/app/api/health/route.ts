import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await query<{ schema_ready: boolean }>(
      "SELECT to_regclass('rukn_ai.knowledge_documents') IS NOT NULL AS schema_ready"
    );
    return NextResponse.json({
      ok: true,
      database: "connected",
      schema: result.rows[0]?.schema_ready ? "ready" : "missing",
      aiProvider: process.env.OPENAI_API_KEY ? "configured" : "not_configured"
    });
  } catch {
    return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
  }
}