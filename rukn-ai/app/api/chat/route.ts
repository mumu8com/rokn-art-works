import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!verifySession(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { message, sessionId } = await request.json();
    const prompt = String(message || "").trim().slice(0, 6000);
    if (prompt.length < 2) return NextResponse.json({ error: "message_required" }, { status: 400 });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let sid = typeof sessionId === "string" ? sessionId : null;
      if (sid) {
        const existing = await client.query("SELECT id FROM rukn_ai.chat_sessions WHERE id=$1", [sid]);
        if (!existing.rowCount) sid = null;
      }
      if (!sid) {
        const created = await client.query("INSERT INTO rukn_ai.chat_sessions(title) VALUES($1) RETURNING id", [prompt.slice(0,70)]);
        sid = created.rows[0].id as string;
      }
      const userMsg = await client.query("INSERT INTO rukn_ai.chat_messages(session_id,role,content) VALUES($1,'user',$2) RETURNING id", [sid,prompt]);
      const retrieved = await client.query(
        "SELECT d.id,d.title,d.category,c.content FROM rukn_ai.knowledge_chunks c JOIN rukn_ai.knowledge_documents d ON d.id=c.document_id WHERE d.status='approved' AND c.search_vector @@ websearch_to_tsquery('simple',$1) ORDER BY ts_rank(c.search_vector,websearch_to_tsquery('simple',$1)) DESC LIMIT 5",
        [prompt]
      );
      const sources = retrieved.rows.map((r: any) => ({ id:r.id, title:r.title, category:r.category, excerpt:r.content.slice(0,500) }));
      let answer = "";
      let mode = "knowledge_only";
      if (process.env.OPENAI_API_KEY) {
        const context = sources.map((s: any, i: number) => "["+(i+1)+"] "+s.title+" / "+s.category+"\\n"+s.excerpt).join("\\n\\n");
        const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
          method:"POST",
          headers:{ "Authorization":"Bearer "+process.env.OPENAI_API_KEY, "Content-Type":"application/json" },
          body:JSON.stringify({
            model:process.env.OPENAI_MODEL || "gpt-4.1-mini",
            temperature:0.2,
            messages:[
              {role:"system",content:"أنت RUKN AI، المساعد المعرفي الداخلي لركن للأعمال الفنية. أجب بالعربية بوضوح. استخدم سياق قاعدة المعرفة فقط للحقائق الخاصة بركن. إذا كانت المعلومات غير متوفرة فقل ذلك ولا تخترع أسعاراً أو مواصفات. لا تعتمد أو تعدّل المعرفة؛ اقترح إضافات فقط."},
              {role:"user",content:"سياق المعرفة المعتمد:\\n"+(context || "لا توجد معلومات معتمدة مطابقة.")+"\\n\\nسؤال المدير: "+prompt}
            ]
          })
        });
        if (upstream.ok) {
          const data = await upstream.json();
          answer = data.choices?.[0]?.message?.content || "لم يصل رد من نموذج الذكاء الاصطناعي.";
          mode = "llm_rag";
        } else {
          answer = "تعذر الاتصال بمزود النموذج حالياً. تم حفظ سؤالك واسترجاع مصادر المعرفة المطابقة.";
        }
      } else {
        answer = sources.length
          ? "استرجعت معلومات معتمدة ذات صلة من قاعدة معرفة ركن. لم يتم تفعيل محرك توليد الإجابات بعد؛ أضف OPENAI_API_KEY لتشغيل المحادثة التوليدية.\n\nالمصادر: "+sources.map((s:any)=>s.title).join("، ")
          : "لم أجد معلومات معتمدة تطابق هذا السؤال بعد. يمكنك إضافة معلومة إلى مكتبة المعرفة وإرسالها للموافقة، ثم سأستخدمها في الاسترجاع. محرك التوليد يحتاج أيضاً إلى إعداد OPENAI_API_KEY.";
      }
      const assistantMsg = await client.query("INSERT INTO rukn_ai.chat_messages(session_id,role,content,sources) VALUES($1,'assistant',$2,$3::jsonb) RETURNING id", [sid,answer,JSON.stringify(sources)]);
      await client.query("UPDATE rukn_ai.chat_sessions SET updated_at=now() WHERE id=$1",[sid]);
      await client.query("COMMIT");
      return NextResponse.json({ ok:true, sessionId:sid, userMessageId:userMsg.rows[0].id, messageId:assistantMsg.rows[0].id, answer, sources, mode });
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  } catch {
    return NextResponse.json({ error:"chat_failed" }, { status:500 });
  }
}