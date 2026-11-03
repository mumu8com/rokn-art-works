"use client";

import { FormEvent, useEffect, useState } from "react";

type Doc = { id:string; title:string; category:string; status:string; created_at:string };
type Approval = { id:string; item_type:string; action:string; proposed_data:Record<string,string>; created_at:string };
type ChatLine = { role:"user"|"assistant"; content:string; sources?:{title:string;category:string}[]; messageId?:string };

export default function Home() {
  const [health,setHealth] = useState("checking");
  const [authenticated,setAuthenticated] = useState(false);
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [loginError,setLoginError] = useState("");
  const [documents,setDocuments] = useState<Doc[]>([]);
  const [approvals,setApprovals] = useState<Approval[]>([]);
  const [title,setTitle] = useState("");
  const [category,setCategory] = useState("تعريف بالمشروع");
  const [content,setContent] = useState("");
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState("");
  const [tab,setTab] = useState<"overview"|"knowledge"|"approvals"|"assistant">("overview");
  const [question,setQuestion] = useState("");
  const [chat,setChat] = useState<ChatLine[]>([]);
  const [sessionId,setSessionId] = useState("");
  const [chatBusy,setChatBusy] = useState(false);
  const [aiMode,setAiMode] = useState("not_configured");

  async function refresh() {
    const h = await fetch("/api/health").then(r=>r.json()).catch(()=>({ok:false}));
    setHealth(h.ok ? h.schema : "error");
    setAiMode(h.aiProvider || "not_configured");
    const [d,a] = await Promise.all([
      fetch("/api/knowledge").then(r=>r.ok?r.json():null).catch(()=>null),
      fetch("/api/approvals").then(r=>r.ok?r.json():null).catch(()=>null)
    ]);
    if (d?.documents && a?.approvals) {
      setAuthenticated(true); setDocuments(d.documents); setApprovals(a.approvals);
    }
  }

  useEffect(()=>{ refresh(); },[]);

  async function login(e:FormEvent) {
    e.preventDefault(); setLoginError("");
    const r = await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    const data = await r.json().catch(()=>({}));
    if (!r.ok) {
      setLoginError(data.error==="admin_setup_required" ? "إعداد حساب المدير غير مكتمل. أضف RUKN_ADMIN_EMAIL وRUKN_ADMIN_PASSWORD وRUKN_SESSION_SECRET في متغيرات Vercel." : "بيانات الدخول غير صحيحة.");
      return;
    }
    setAuthenticated(true); setPassword(""); await refresh();
  }

  async function logout() {
    await fetch("/api/logout",{method:"POST"});
    setAuthenticated(false); setDocuments([]); setApprovals([]); setChat([]);
  }

  async function addKnowledge(e:FormEvent) {
    e.preventDefault(); setSaving(true); setNotice("");
    const r = await fetch("/api/knowledge",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,category,content})});
    const data = await r.json().catch(()=>({}));
    setSaving(false);
    if (!r.ok) { setNotice("تعذر حفظ المعلومة. تحقق من الاتصال وحاول مجدداً."); return; }
    setTitle(""); setContent(""); setNotice("تم حفظ المعلومة وإرسالها إلى قائمة الموافقات. لن تدخل قاعدة المعرفة المعتمدة قبل موافقتك.");
    await refresh();
  }

  async function review(id:string,decision:"approved"|"rejected") {
    const r = await fetch("/api/approvals",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,decision})});
    if (r.ok) { setNotice(decision==="approved"?"تم اعتماد المعلومة وإتاحتها للاسترجاع.":"تم رفض المعلومة."); await refresh(); }
  }

  async function ask(e:FormEvent) {
    e.preventDefault(); if (!question.trim()) return;
    const q = question.trim(); setQuestion(""); setChat(old=>[...old,{role:"user",content:q}]); setChatBusy(true);
    const r = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q,sessionId:sessionId||undefined})});
    const data = await r.json().catch(()=>({}));
    setChatBusy(false);
    if (!r.ok) { setChat(old=>[...old,{role:"assistant",content:"تعذر تنفيذ المحادثة. تحقق من تسجيل الدخول والاتصال بقاعدة البيانات."}]); return; }
    setSessionId(data.sessionId);
    setChat(old=>[...old,{role:"assistant",content:data.answer,sources:data.sources,messageId:data.messageId}]);
  }

  if (!authenticated) return <main className="login-wrap">
    <div className="login-card">
      <div className="brand"><span className="brand-mark">ر</span><div><strong>RUKN AI</strong><small>المساعد المعرفي لركن للأعمال الفنية</small></div></div>
      <div className="eyebrow">PRIVATE WORKSPACE · 01</div>
      <h1>مرحباً بك في عقل ركن.</h1>
      <p>مساحة خاصة لإدارة المعرفة والمشاريع والتكاليف وتطوير المساعد الذكي.</p>
      <form onSubmit={login} className="form-stack">
        <label>البريد الإلكتروني<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="admin@example.com"/></label>
        <label>كلمة المرور<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••••••"/></label>
        {loginError && <div className="alert">{loginError}</div>}
        <button className="primary-btn" type="submit">دخول إلى مساحة العمل <span>←</span></button>
      </form>
      <div className="login-foot"><span className={"dot "+(health==="ready"?"on":"")}></span> قاعدة البيانات: {health==="ready"?"متصلة":health==="checking"?"جارٍ الفحص":"غير متصلة"}</div>
    </div>
    <div className="login-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="r-letter">ر</div><span>IDEAS → DESIGN → MAKING</span></div>
  </main>;

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">ر</span><div><strong>RUKN AI</strong><small>ART WORKS INTELLIGENCE</small></div></div>
      <div className="workspace-label">مساحة العمل</div>
      <nav>
        <button className={tab==="overview"?"active":""} onClick={()=>setTab("overview")}><span>◫</span> نظرة عامة</button>
        <button className={tab==="assistant"?"active":""} onClick={()=>setTab("assistant")}><span>✳</span> المساعد الذكي</button>
        <button className={tab==="knowledge"?"active":""} onClick={()=>setTab("knowledge")}><span>▤</span> مكتبة المعرفة</button>
        <button className={tab==="approvals"?"active":""} onClick={()=>setTab("approvals")}><span>✓</span> الموافقات <b>{approvals.length}</b></button>
      </nav>
      <div className="sidebar-bottom"><div className="status-card"><span className="dot on"/><div><strong>قاعدة البيانات</strong><small>{health==="ready"?"متصلة وآمنة":"تحتاج فحصاً"}</small></div></div><button className="logout" onClick={logout}>تسجيل الخروج ↗</button></div>
    </aside>
    <section className="main-area">
      <header className="topbar"><div><span className="eyebrow">ROKN / INTELLIGENCE</span><h1>{tab==="overview"?"مركز المعرفة":tab==="assistant"?"المساعد الذكي":tab==="knowledge"?"مكتبة المعرفة":"مراجعة واعتماد"}</h1></div><div className="top-status"><span className={"dot "+(health==="ready"?"on":"")}/><span>{health==="ready"?"متصل":"فحص الاتصال"}</span><span className="admin-chip">المدير</span></div></header>
      {notice && <div className="notice" onClick={()=>setNotice("")}>{notice}<button>×</button></div>}
      {tab==="overview" && <div className="content">
        <section className="welcome-panel"><div><span className="eyebrow">YOUR KNOWLEDGE. YOUR ADVANTAGE.</span><h2>كل مشروع يضيف خبرة.<br/><em>وكل خبرة تصنع فرقاً.</em></h2><p>RUKN AI يجمع خبرة ركن في التصميم والتصنيع والتسعير داخل ذاكرة قابلة للبحث والمراجعة.</p><button className="primary-btn" onClick={()=>setTab("assistant")}>ابدأ محادثة <span>←</span></button></div><div className="welcome-mark">ر<span>ROKN</span></div></section>
        <div className="stats-grid"><article><span>المعلومات المسجلة</span><strong>{documents.length}</strong><small>كل الحالات</small></article><article><span>بانتظار موافقتك</span><strong>{approvals.length}</strong><small>لا تُستخدم قبل الاعتماد</small></article><article><span>معلومات معتمدة</span><strong>{documents.filter(d=>d.status==="approved").length}</strong><small>متاحة للاسترجاع</small></article><article><span>محرك التوليد</span><strong className="state-word">{aiMode==="configured"?"جاهز":"غير مربوط"}</strong><small>{aiMode==="configured"?"متصل بمزود الذكاء":"يتطلب مفتاح مزود"}</small></article></div>
        <div className="section-head"><div><span className="eyebrow">WORKFLOW</span><h2>كيف تتطور ذاكرة ركن؟</h2></div></div>
        <div className="steps-grid"><article><i>01</i><h3>أضف المعرفة</h3><p>معلومات الخدمات والخامات والمشاريع والأسعار.</p></article><article><i>02</i><h3>راجع المقترح</h3><p>كل معلومة جديدة تنتظر موافقتك قبل اعتمادها.</p></article><article><i>03</i><h3>استخدم المعرفة</h3><p>يسترجع المساعد المعلومات المعتمدة عند الإجابة.</p></article><article><i>04</i><h3>حسّن النتائج</h3><p>صحح الإجابات وأرسل الملاحظات إلى المراجعة.</p></article></div>
        <div className="section-head"><div><span className="eyebrow">BUSINESS SCOPE</span><h2>مجالات معرفة ركن</h2></div></div>
        <div className="chips"><span>النجارة والأثاث</span><span>الديكور والمطابخ</span><span>CNC والراوتر</span><span>الليزر</span><span>الطباعة ثلاثية الأبعاد</span><span>الدروع والهدايا</span><span>الإعلانات واللوحات</span><span>الخامات والتكاليف</span><span>التصميم والإنتاج</span></div>
      </div>}
      {tab==="knowledge" && <div className="content two-col">
        <section className="panel"><div className="panel-head"><div><span className="eyebrow">KNOWLEDGE INPUT</span><h2>إضافة معلومة جديدة</h2></div><span className="lock-label">تحتاج موافقة</span></div><p className="muted">أضف تفاصيل موثوقة من أعمال ركن. ستُحفظ كمسودة ولا تصبح مرجعاً للمساعد إلا بعد اعتمادك.</p>
          <form onSubmit={addKnowledge} className="form-stack"><label>عنوان المعلومة<input value={title} onChange={e=>setTitle(e.target.value)} required minLength={3} placeholder="مثلاً: مواصفات تصنيع درع أكريليك"/></label><label>التصنيف<select value={category} onChange={e=>setCategory(e.target.value)}>{["تعريف بالمشروع","خدمات","خامات","معدات وتقنيات","تسعير وتكاليف","مشاريع سابقة","إجراءات الإنتاج","ملاحظات العملاء","عام"].map(x=><option key={x}>{x}</option>)}</select></label><label>المحتوى<textarea value={content} onChange={e=>setContent(e.target.value)} required minLength={20} rows={8} placeholder="اكتب المعلومة بالتفصيل، مع المقاسات والخامات والأرقام عند توفرها..."/></label><button className="primary-btn" disabled={saving}>{saving?"جارٍ الحفظ...":"إرسال للمراجعة ←"}</button></form>
        </section>
        <section className="panel"><div className="panel-head"><div><span className="eyebrow">KNOWLEDGE LIBRARY</span><h2>المعلومات المسجلة</h2></div><span className="count-pill">{documents.length}</span></div>{documents.length===0?<div className="empty">لم تتم إضافة معلومات بعد.</div>:<div className="doc-list">{documents.map(d=><article key={d.id}><div><strong>{d.title}</strong><small>{d.category} · {new Date(d.created_at).toLocaleDateString("ar")}</small></div><span className={"status "+d.status}>{d.status==="approved"?"معتمدة":d.status==="rejected"?"مرفوضة":"قيد المراجعة"}</span></article>)}</div>}</section>
      </div>}
      {tab==="approvals" && <div className="content"><div className="panel"><div className="panel-head"><div><span className="eyebrow">HUMAN-IN-THE-LOOP</span><h2>العناصر التي تنتظر قرارك</h2></div><span className="count-pill">{approvals.length}</span></div>{approvals.length===0?<div className="empty">لا توجد عناصر معلقة. ستظهر هنا أي معلومة جديدة أو تصحيح مقترح.</div>:<div className="approval-list">{approvals.map(a=><article key={a.id}><div className="approval-copy"><span className="eyebrow">{a.item_type} · {a.action}</span><h3>{a.proposed_data?.title || a.proposed_data?.service_name || "عنصر جديد"}</h3><p>{a.proposed_data?.category || "مقترح من قاعدة المعرفة"}</p><small>{new Date(a.created_at).toLocaleString("ar")}</small></div><div className="approval-actions"><button className="approve" onClick={()=>review(a.id,"approved")}>اعتماد</button><button className="reject" onClick={()=>review(a.id,"rejected")}>رفض</button></div></article>)}</div>}</div></div>}
      {tab==="assistant" && <div className="content assistant-layout"><section className="chat-panel"><div className="chat-head"><div><span className="eyebrow">RUKN KNOWLEDGE ASSISTANT</span><h2>اسأل عقل ركن</h2></div><span className="beta-pill">نسخة أولية</span></div><div className="chat-messages">{chat.length===0&&<div className="chat-empty"><div>✳</div><h3>ما الذي نريد إنجازه اليوم؟</h3><p>اسأل عن الخدمات والخامات والمشاريع السابقة أو اطلب مساعدة في تنظيم فكرة جديدة.</p><div className="suggestions"><button onClick={()=>setQuestion("ما الخدمات التي يقدمها ركن؟")}>ما خدمات ركن؟</button><button onClick={()=>setQuestion("كيف نبدأ تسعير مشروع جديد؟")}>كيف أسعّر مشروعاً؟</button><button onClick={()=>setQuestion("ما المعلومات الناقصة في قاعدة المعرفة؟")}>ما المعلومات الناقصة؟</button></div></div>}{chat.map((m,i)=><div key={i} className={"bubble "+m.role}><p>{m.content}</p>{m.sources?.length ? <div className="sources">المصادر: {m.sources.map(s=>s.title).join("، ")}</div>:null}</div>)}{chatBusy&&<div className="bubble assistant">جارٍ البحث في ذاكرة ركن...</div>}</div><form className="chat-form" onSubmit={ask}><textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={2} placeholder="اكتب سؤالك أو وصف فكرتك..." disabled={chatBusy}/><button className="primary-btn" disabled={chatBusy||!question.trim()}>إرسال ←</button></form><div className="chat-note">الإجابات تعتمد على المعلومات المعتمدة فقط. لا تُخترع الأسعار أو المواصفات.</div></section><aside className="assistant-side"><div className="panel"><span className="eyebrow">MODEL STATUS</span><h3>حالة محرك الذكاء</h3><div className="model-status"><span className={"dot "+(aiMode==="configured"?"on":"")}/><strong>{aiMode==="configured"?"متصل":"بانتظار الربط"}</strong></div><p>قاعدة المعرفة والاسترجاع جاهزان. لتفعيل توليد الإجابات، أضف مفتاح مزود النموذج إلى بيئة المشروع.</p><div className="code-label">OPENAI_API_KEY</div></div><div className="panel"><span className="eyebrow">TRUST & CONTROL</span><h3>سياسة التعلم</h3><ul><li>لا اعتماد تلقائي للمعرفة.</li><li>المصادر المعتمدة فقط تدخل الاسترجاع.</li><li>التصحيحات تحفظ للمراجعة.</li><li>سجل تدقيق لكل قرار إداري.</li></ul></div></aside></div>}
      <footer className="footer">RUKN AI <span>نسخة تطوير خاصة · لا تغيّر بيانات الإنتاج</span></footer>
    </section>
  </main>;
}
