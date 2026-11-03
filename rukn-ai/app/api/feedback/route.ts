import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!verifySession(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { sessionId, messageId, rating, prompt, response, correction } = await request.json();
    if (!["helpful","not_helpful","correction"].includes(rating)) return NextResponse.json({ error:"invalid_rating" },{status:400});
    const result = await query(
      "INSERT INTO rukn_ai.feedback(session_id,message_id,rating,user_prompt,ai_response,correction) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",
      [sessionId || null,messageId || null,rating,String(prompt || "").slice(0,6000),String(response || "").slice(0,10000),String(correction || "").slice(0,10000)]
    );
    return NextResponse.json({ ok:true, id:result.rows[0].id, status:"pending_approval" },{status:201});
  } catch { return NextResponse.json({error:"feedback_failed"},{status:500}); }
}