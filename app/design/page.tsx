"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, Layers3, Mail, RotateCcw, Ruler, Sparkles } from "lucide-react";

const templates = [
  {id:"shield",name:"درع تكريمي",category:"دروع",shape:"shield",description:"مناسب للتكريم والإنجازات"},
  {id:"medal",name:"ميدالية تذكارية",category:"ميداليات",shape:"medal",description:"هدية رمزية بلمسة خاصة"},
  {id:"plaque",name:"لوحة تذكارية",category:"لوحات",shape:"plaque",description:"للمؤسسات والفعاليات"},
];
const materials = ["أكريليك","خشب","معدن","أكريليك وخشب","حسب توصية فريق ركن"];
const sizes = ["صغير — 15 × 20 سم","متوسط — 20 × 30 سم","كبير — 30 × 40 سم","مقاس مخصص"];

export default function DesignPage() {
  const [templateId,setTemplateId] = useState("shield");
  const [title,setTitle] = useState("شكر وتقدير");
  const [subtitle,setSubtitle] = useState("تقديرًا لجهودكم وعطائكم");
  const [recipient,setRecipient] = useState("يُكتب الاسم هنا");
  const [color,setColor] = useState("#173b53");
  const [accent,setAccent] = useState("#d7b56d");
  const [material,setMaterial] = useState("أكريليك وخشب");
  const [size,setSize] = useState(sizes[1]);
  const [quantity,setQuantity] = useState("1");
  const [notes,setNotes] = useState("");
  const [notice,setNotice] = useState("");
  const current = templates.find(t=>t.id===templateId) || templates[0];
  const safe = (value:string) => value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll("\"","&quot;").replaceAll("'","&apos;");
  const svg = useMemo(() => {
    const shape = templateId==="shield"
      ? '<path d="M55 35 H345 V205 L200 285 L55 205 Z" fill="'+color+'" stroke="'+accent+'" stroke-width="8"/>'
      : templateId==="medal"
      ? '<circle cx="200" cy="155" r="105" fill="'+color+'" stroke="'+accent+'" stroke-width="9"/><path d="M145 38 L125 0 H175 L200 38 L225 0 H275 L255 38" fill="'+accent+'"/>'
      : '<rect x="38" y="50" width="324" height="210" rx="8" fill="'+color+'" stroke="'+accent+'" stroke-width="9"/>';
    const y1=templateId==="medal"?130:122, y2=templateId==="medal"?169:164, y3=templateId==="medal"?205:207;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="800" viewBox="0 0 400 320">'+shape+'<text x="200" y="'+y1+'" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="'+accent+'">'+safe(title)+'</text><text x="200" y="'+y2+'" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#ffffff">'+safe(recipient)+'</text><text x="200" y="'+y3+'" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="'+accent+'">'+safe(subtitle)+'</text></svg>';
  },[templateId,color,accent,title,recipient,subtitle]);
  function exportSvg() {
    const blob = new Blob([svg],{type:"image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="rokn-custom-design.svg"; a.click();
    URL.revokeObjectURL(url); setNotice("تم تنزيل ملف SVG للمعاينة. هذه نسخة تصميم أولية وليست ملف تصنيع نهائيًا.");
  }
  function reset() { setTemplateId("shield");setTitle("شكر وتقدير");setSubtitle("تقديرًا لجهودكم وعطائكم");setRecipient("يُكتب الاسم هنا");setColor("#173b53");setAccent("#d7b56d");setMaterial("أكريليك وخشب");setSize(sizes[1]);setQuantity("1");setNotes("");setNotice("تمت إعادة الإعدادات إلى القيم الافتراضية."); }
  function requestQuote() {
    const subject = encodeURIComponent("طلب عرض سعر - ركن للأعمال الفنية");
    const body = encodeURIComponent("السلام عليكم، أود الاستفسار عن تنفيذ التصميم التالي:\n\nالمنتج: "+current.name+"\nالنص الرئيسي: "+title+"\nاسم المكرّم/النص: "+recipient+"\nالنص الإضافي: "+subtitle+"\nالخامة: "+material+"\nالمقاس: "+size+"\nالكمية: "+quantity+"\nاللون الأساسي: "+color+"\nلون الزخرفة: "+accent+"\nملاحظات: "+(notes||"لا توجد") +"\n\nيرجى التواصل معي لمراجعة المواصفات والتكلفة.\nملاحظة: سأرفق ملف التصميم عند الحاجة.");
    window.location.href="mailto:info@rokn-art-works.com?subject="+subject+"&body="+body;
  }

  return <main className="editor-shell" dir="rtl">
    <header className="editor-top"><div className="editor-title"><Link href="/" className="brand-mark">ر</Link><div><h1>استوديو تصميم ركن</h1><p>خصّص معاينة منتجك قبل طلب عرض السعر</p></div></div><Link href="/" className="btn secondary"><ArrowRight size={16}/> العودة للمتجر</Link></header>
    <div className="editor-layout">
      <section className="editor-panel"><h3><Layers3 size={17} style={{display:"inline",verticalAlign:"middle",marginLeft:7}}/> 1. اختر المنتج</h3>
        {templates.map(t=><button type="button" key={t.id} className={"editor-template "+(templateId===t.id?"selected":"")} onClick={()=>setTemplateId(t.id)}><span className="template-icon"><Sparkles size={18}/></span><span style={{flex:1}}><b>{t.name}</b><small>{t.description}</small></span>{templateId===t.id&&<span style={{color:"#376b88"}}>✓</span>}</button>)}
        <label className="field-label" htmlFor="material">الخامة المقترحة</label><select id="material" value={material} onChange={e=>setMaterial(e.target.value)}>{materials.map(m=><option key={m}>{m}</option>)}</select>
        <label className="field-label" htmlFor="size"><Ruler size={14} style={{display:"inline",verticalAlign:"middle",marginLeft:5}}/> المقاس</label><select id="size" value={size} onChange={e=>setSize(e.target.value)}>{sizes.map(s=><option key={s}>{s}</option>)}</select>
        <label className="field-label" htmlFor="quantity">الكمية المطلوبة</label><input id="quantity" type="number" min="1" max="10000" value={quantity} onChange={e=>setQuantity(e.target.value)}/>
        <p className="editor-help">الخامة والمقاس النهائيان والسعر يتم تأكيدها بعد مراجعة إمكانية التنفيذ.</p>
      </section>
      <section className="editor-stage"><div className="stage-toolbar"><span>معاينة التصميم</span><span>عرض تجريبي · غير مخصص للتصنيع المباشر</span></div><div className="stage-canvas"><div className={"stage-product "+current.shape} style={{background:"linear-gradient(145deg,"+color+",#102b43)"}}><div className="stage-inner" style={{borderColor:accent}}><span style={{color:accent,fontSize:10,letterSpacing:1}}>ROKN · CUSTOM MADE</span><strong style={{color:accent}}>{title||"عنوان التصميم"}</strong><i style={{background:accent}}/><span>{recipient||"اسم المكرّم"}</span><span style={{color:accent,fontSize:12}}>{subtitle}</span></div></div></div><div className="stage-toolbar"><span>الخامة: {material}</span><span>{size}</span></div></section>
      <section className="editor-panel"><h3>2. تفاصيل التصميم</h3>
        <label className="field-label" htmlFor="title">العنوان الرئيسي</label><input id="title" maxLength={80} value={title} onChange={e=>setTitle(e.target.value)} placeholder="شكر وتقدير"/>
        <label className="field-label" htmlFor="recipient">اسم الشخص أو الجهة</label><input id="recipient" maxLength={100} value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="الاسم أو الجهة"/>
        <label className="field-label" htmlFor="subtitle">النص الإضافي</label><textarea id="subtitle" maxLength={180} rows={3} value={subtitle} onChange={e=>setSubtitle(e.target.value)} placeholder="عبارة قصيرة أو تاريخ المناسبة"/>
        <label className="field-label">الألوان</label><div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}><label style={{fontSize:11,color:"#6d7c8c"}}>لون القاعدة <input aria-label="لون القاعدة" type="color" value={color} onChange={e=>setColor(e.target.value)} style={{display:"block",width:44,height:36,border:0,background:"none"}}/></label><label style={{fontSize:11,color:"#6d7c8c"}}>لون الزخرفة <input aria-label="لون الزخرفة" type="color" value={accent} onChange={e=>setAccent(e.target.value)} style={{display:"block",width:44,height:36,border:0,background:"none"}}/></label><div className="swatch-row"><span className="swatch" style={{background:color}}/><span className="swatch" style={{background:accent}}/></div></div>
        <label className="field-label" htmlFor="notes">ملاحظات للتنفيذ</label><textarea id="notes" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="الشعار، طريقة التعليق، موعد المناسبة..."/>
        <div className="editor-actions"><button className="btn primary" onClick={requestQuote}><Mail size={16}/> تجهيز طلب عرض سعر</button><button className="btn secondary" onClick={exportSvg}><Download size={16}/> تنزيل المعاينة SVG</button><button className="btn secondary" onClick={reset}><RotateCcw size={15}/> إعادة الضبط</button></div>
        {notice&&<p className="editor-help" role="status">{notice}</p>}
      </section>
    </div>
    <p className="editor-help" style={{marginTop:18}}>تنبيه: هذه أداة معاينة أولية ثنائية الأبعاد. لا تحفظ الطلبات داخل حساب العميل ولا ترسلها تلقائيًا إلى قاعدة بيانات؛ زر عرض السعر يفتح تطبيق البريد لإرسال تفاصيلك، ويجب إرفاق ملف SVG يدويًا عند الحاجة.</p>
  </main>;
}
