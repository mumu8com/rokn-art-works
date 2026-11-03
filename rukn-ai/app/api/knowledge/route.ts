import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { pool, query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!verifySession(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await query(
    "SELECT id,title,category,source_type,status,created_at,approved_at FROM rukn_ai.knowledge_documents ORDER BY created_at DESC LIMIT 100"
  );
  return NextResponse.json({ documents: result.rows });
}

export async function POST(request: Request) {
  if (!verifySession(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const title = String(body.title || "").trim().slice(0, 180);
    const category = String(body.category || "general").trim().slice(0, 80);
    const content = String(body.content || "").trim().slice(0, 50000);
    if (title.length < 3 || content.length < 20) return NextResponse.json({ error: "title_or_content_too_short" }, { status: 400 });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const doc = await client.query(
        "INSERT INTO rukn_ai.knowledge_documents(title,category,content,source_type,status,created_by) VALUES($1,$2,$3,'manual','pending','admin') RETURNING id",
        [title, category, content]
      );
      const id = doc.rows[0].id as string;
      const chunks = content.match(/[\\s\\S]{1,1100}/g) || [content];
      for (let i = 0; i < chunks.length; i++) {
        await client.query("INSERT INTO rukn_ai.knowledge_chunks(document_id,chunk_index,content) VALUES($1,$2,$3)", [id, i, chunks[i]]);
      }
      await client.query(
        "INSERT INTO rukn_ai.approval_queue(item_type,item_id,action,proposed_data,submitted_by) VALUES('knowledge',$1,'create',$2::jsonb,'admin')",
        [id, JSON.stringify({ title, category })]
      );
      await client.query("INSERT INTO rukn_ai.audit_log(action,entity_type,entity_id,actor,details) VALUES('knowledge_submitted','knowledge',$1,'admin',$2::jsonb)", [id, JSON.stringify({ title, category })]);
      await client.query("COMMIT");
      return NextResponse.json({ ok: true, id, status: "pending_approval" }, { status: 201 });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  } catch {
    return NextResponse.json({ error: "could_not_save_knowledge" }, { status: 500 });
  }
}