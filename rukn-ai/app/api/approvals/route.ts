import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { pool, query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!verifySession(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await query(
    "SELECT id,item_type,item_id,action,proposed_data,status,submitted_by,created_at FROM rukn_ai.approval_queue WHERE status='pending' ORDER BY created_at ASC LIMIT 100"
  );
  return NextResponse.json({ approvals: result.rows });
}

export async function PATCH(request: Request) {
  if (!verifySession(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { id, decision, note } = await request.json();
    if (typeof id !== "string" || !["approved", "rejected"].includes(decision)) return NextResponse.json({ error: "invalid_decision" }, { status: 400 });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const approval = await client.query("SELECT * FROM rukn_ai.approval_queue WHERE id=$1 FOR UPDATE", [id]);
      if (!approval.rowCount) { await client.query("ROLLBACK"); return NextResponse.json({ error: "not_found" }, { status: 404 }); }
      const item = approval.rows[0];
      if (item.status !== "pending") { await client.query("ROLLBACK"); return NextResponse.json({ error: "already_reviewed" }, { status: 409 }); }
      if (item.item_type === "knowledge" && item.item_id) {
        await client.query("UPDATE rukn_ai.knowledge_documents SET status=$2,approved_by='admin',approved_at=CASE WHEN $2='approved' THEN now() ELSE NULL END WHERE id=$1", [item.item_id, decision === "approved" ? "approved" : "rejected"]);
      }
      if (item.item_type === "pricing" && item.item_id) {
        await client.query("UPDATE rukn_ai.pricing_observations SET status=$2,approved_at=CASE WHEN $2='approved' THEN now() ELSE NULL END WHERE id=$1", [item.item_id, decision === "approved" ? "approved" : "rejected"]);
      }
      await client.query("UPDATE rukn_ai.approval_queue SET status=$2,reviewed_by='admin',review_note=$3,reviewed_at=now() WHERE id=$1", [id, decision, String(note || "").slice(0,1000)]);
      await client.query("INSERT INTO rukn_ai.audit_log(action,entity_type,entity_id,actor,details) VALUES($1,'approval',$2,'admin',$3::jsonb)", [decision, id, JSON.stringify({ itemType: item.item_type, itemId: item.item_id })]);
      await client.query("COMMIT");
      return NextResponse.json({ ok: true, status: decision });
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  } catch {
    return NextResponse.json({ error: "approval_failed" }, { status: 500 });
  }
}