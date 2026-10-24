"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "تعذر تسجيل الدخول."); return; }
      window.location.assign("/admin");
    } catch { setError("تعذر الاتصال بالخادم. حاول مرة أخرى."); }
    finally { setBusy(false); }
  }

  return <main className="login-shell">
    <div className="login-brand"><Link href="/" className="brand-mark">ر</Link><div><strong>ركن للأعمال الفنية</strong><span>بوابة الإدارة</span></div></div>
    <section className="login-card">
      <div className="login-icon"><ShieldCheck size={25}/></div>
      <p className="eyebrow">مساحة عمل خاصة</p><h1>مرحبًا بعودتك</h1>
      <p className="muted">سجّل الدخول لإدارة المنتجات والتصميمات والطلبات.</p>
      <form onSubmit={submit} className="admin-login-form">
        <label htmlFor="email">البريد الإلكتروني للمدير</label>
        <input id="email" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com"/>
        <label htmlFor="password">كلمة المرور</label>
        <div className="password-field"><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="أدخل كلمة المرور"/><button type="button" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={()=>setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn primary login-submit" type="submit" disabled={busy}>{busy ? "جارٍ التحقق..." : <><LockKeyhole size={17}/> تسجيل الدخول</>}</button>
      </form>
      <div className="secure-note"><LockKeyhole size={15}/> جلسة محمية بملف تعريف ارتباط HttpOnly</div>
    </section>
    <Link href="/" className="back-home"><ArrowRight size={16}/> العودة إلى الموقع</Link>
  </main>;
}
