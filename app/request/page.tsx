"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LoaderCircle, ShoppingBag, FileText } from "lucide-react";

type Product = {id:number;name:string;category:string;price:string;description:string};
export default function RequestPage() {
  const [products,setProducts]=useState<Product[]>([]);
  const [mode,setMode]=useState<"order"|"quote">("quote");
  const [productId,setProductId]=useState("");
  const [customerName,setCustomerName]=useState("");
  const [phone,setPhone]=useState("");
  const [email,setEmail]=useState("");
  const [quantity,setQuantity]=useState("1");
  const [details,setDetails]=useState("");
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  useEffect(()=>{fetch("/api/products").then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"تعذر تحميل المنتجات");setProducts(d.products||[]);if(d.products?.length)setProductId(String(d.products[0].id));}).catch(e=>setError(e instanceof Error?e.message:"تعذر تحميل المنتجات")).finally(()=>setLoading(false));},[]);
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError("");setSuccess("");
    if(!productId){setError("لا توجد منتجات منشورة للاختيار حاليًا.");return;}
    setSending(true);
    try{
      const response=await fetch(mode==="order"?"/api/orders":"/api/quotes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerName,phone,email,productId:Number(productId),quantity:Number(quantity),details})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذر إرسال الطلب");
      setSuccess(mode==="order"?("تم تسجيل طلبك بنجاح. رقم الطلب: "+data.orderId):("تم إرسال طلب عرض السعر بنجاح. رقم المتابعة: "+data.quoteId));
      setCustomerName("");setPhone("");setEmail("");setQuantity("1");setDetails("");
    }catch(e){setError(e instanceof Error?e.message:"حدث خطأ أثناء الإرسال.");}finally{setSending(false);}
  }
  return <main dir="rtl" style={{minHeight:"100vh",background:"#f5f7fa",padding:"28px 16px",color:"#182334"}}>
    <div style={{maxWidth:820,margin:"0 auto"}}>
      <Link href="/" style={{display:"inline-flex",gap:8,alignItems:"center",color:"#7b6034",textDecoration:"none",marginBottom:22}}><ArrowRight size={17}/> العودة إلى متجر ركن</Link>
      <section style={{background:"#fff",border:"1px solid #e0e6ed",borderRadius:22,padding:"clamp(20px,4vw,38px)",boxShadow:"0 12px 35px rgba(24,35,52,.06)"}}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:8}}><span style={{background:"#f5eddd",padding:12,borderRadius:14,color:"#89672f"}}><ShoppingBag size={22}/></span><div><h1 style={{fontSize:28,margin:0}}>طلب منتج أو عرض سعر</h1><p style={{margin:"6px 0 0",color:"#64748b"}}>أرسل بياناتك ومواصفاتك، وسنراجع التفاصيل قبل تأكيد التنفيذ.</p></div></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10,margin:"24px 0"}}>
          <button type="button" onClick={()=>setMode("quote")} style={{padding:14,borderRadius:12,border:mode==="quote"?"2px solid #a47e43":"1px solid #d9e0e8",background:mode==="quote"?"#fbf7ef":"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",fontWeight:700}}><FileText size={18}/> طلب عرض سعر</button>
          <button type="button" onClick={()=>setMode("order")} style={{padding:14,borderRadius:12,border:mode==="order"?"2px solid #a47e43":"1px solid #d9e0e8",background:mode==="order"?"#fbf7ef":"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",fontWeight:700}}><ShoppingBag size={18}/> طلب تنفيذ</button>
        </div>
        {success&&<div role="status" style={{padding:13,borderRadius:10,background:"#edf8f0",color:"#24633a",marginBottom:16,overflowWrap:"anywhere"}}><CheckCircle2 size={17} style={{display:"inline",verticalAlign:"middle",marginLeft:7}}/>{success}</div>}
        {error&&<div role="alert" style={{padding:13,borderRadius:10,background:"#fff0ef",color:"#a12d28",marginBottom:16}}>{error}</div>}
        {loading?<p style={{display:"flex",gap:8,alignItems:"center"}}><LoaderCircle size={18}/> جارٍ تحميل المنتجات المنشورة...</p>:<form onSubmit={submit} style={{display:"grid",gap:15}}>
          <label style={labelStyle}>المنتج المطلوب<select required value={productId} onChange={e=>setProductId(e.target.value)} style={inputStyle}><option value="">اختر المنتج</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} — {p.category} ({p.price})</option>)}</select>{products.length===0&&<small style={{color:"#a12d28"}}>لا توجد منتجات منشورة بعد. يرجى العودة لاحقًا.</small>}</label>
          {productId&&products.find(p=>String(p.id)===productId)?.description&&<p style={{margin:"-8px 0 0",color:"#64748b",fontSize:13}}>{products.find(p=>String(p.id)===productId)?.description}</p>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
            <label style={labelStyle}>الاسم الكامل<input required maxLength={120} value={customerName} onChange={e=>setCustomerName(e.target.value)} style={inputStyle} placeholder="اسم العميل"/></label>
            <label style={labelStyle}>رقم الهاتف<input required maxLength={40} value={phone} onChange={e=>setPhone(e.target.value)} style={inputStyle} placeholder="رقم للتواصل" dir="ltr"/></label>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
            <label style={labelStyle}>البريد الإلكتروني (اختياري)<input type="email" maxLength={160} value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle} placeholder="name@example.com" dir="ltr"/></label>
            <label style={labelStyle}>الكمية<input required type="number" min="1" max="1000" value={quantity} onChange={e=>setQuantity(e.target.value)} style={inputStyle}/></label>
          </div>
          <label style={labelStyle}>المواصفات أو ملاحظات إضافية<textarea maxLength={4000} rows={4} value={details} onChange={e=>setDetails(e.target.value)} style={{...inputStyle,resize:"vertical"}} placeholder="المقاس، الخامة، النص المراد كتابته، موعد الحاجة..."/></label>
          <button disabled={sending||loading||products.length===0} type="submit" style={{border:0,borderRadius:12,padding:"14px 18px",background:sending||products.length===0?"#aab2bc":"#192638",color:"#fff",fontWeight:700,cursor:sending||products.length===0?"not-allowed":"pointer",display:"flex",justifyContent:"center",alignItems:"center",gap:9}}>{sending&&<LoaderCircle size={18}/>} {sending?"جارٍ الإرسال...":mode==="order"?"إرسال طلب التنفيذ":"إرسال طلب عرض السعر"}</button>
          <small style={{color:"#64748b",lineHeight:1.7}}>إرسال الطلب لا يعني تأكيد السعر أو بدء التصنيع. سيتم مراجعة التفاصيل والتواصل معك لتأكيد التكلفة والموعد.</small>
        </form>}
      </section>
    </div>
  </main>;
}
const labelStyle={display:"grid",gap:7,fontSize:14,fontWeight:600 as const};
const inputStyle={width:"100%",boxSizing:"border-box" as const,padding:"12px 13px",border:"1px solid #d9e0e8",borderRadius:10,background:"#fff",fontSize:14,color:"#182334",outlineColor:"#a47e43"};
