"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, Layers3, Mail, RotateCcw, Ruler, Sparkles, ImagePlus, Plus, Trash2, ShoppingBag, Move, Type, Upload } from "lucide-react";

const templates = [
  {id:"shield",name:"درع تكريمي",category:"دروع",shape:"shield",description:"مناسب للتكريم والإنجازات"},
  {id:"medal",name:"ميدالية تذكارية",category:"ميداليات",shape:"medal",description:"هدية رمزية بلمسة خاصة"},
  {id:"plaque",name:"لوحة تذكارية",category:"لوحات",shape:"plaque",description:"للمؤسسات والفعاليات"},
];
const materials = ["أكريليك","خشب","معدن","أكريليك وخشب","حسب توصية فريق ركن"];
const sizes = ["صغير — 15 × 20 سم","متوسط — 20 × 30 سم","كبير — 30 × 40 سم","مقاس مخصص"];
type ElementItem = {id:number;kind:"text"|"image";value:string;x:number;y:number;size:number;color:string};

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
  const [mainImage,setMainImage] = useState("");
  const [templateImage,setTemplateImage] = useState("");
  const [elements,setElements] = useState<ElementItem[]>([
    {id:1,kind:"text",value:"شكر وتقدير",x:50,y:42,size:23,color:"#d7b56d"},
    {id:2,kind:"text",value:"يُكتب الاسم هنا",x:50,y:55,size:17,color:"#ffffff"},
    {id:3,kind:"text",value:"تقديرًا لجهودكم وعطائكم",x:50,y:67,size:13,color:"#d7b56d"}
  ]);
  const [selectedElement,setSelectedElement] = useState(1);
  const [draggingElement,setDraggingElement] = useState<number|null>(null);
  const [showBooking,setShowBooking] = useState(false);
  const [customer,setCustomer] = useState({name:"",phone:"",deposit:""});
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
  function readImage(file:File|undefined, setter:(v:string)=>void) {
    if(!file) return;
    if(!file.type.startsWith("image/")) { setNotice("يرجى اختيار ملف صورة صالح."); return; }
    if(file.size>5*1024*1024) { setNotice("حجم الصورة كبير؛ الحد الأقصى 5 ميغابايت."); return; }
    const reader=new FileReader(); reader.onload=()=>{setter(String(reader.result||""));setNotice("تم تحميل الصورة للمعاينة.");}; reader.readAsDataURL(file);
  }
  function addText() {
    const item={id:Date.now(),kind:"text" as const,value:"نص جديد",x:50,y:50,size:18,color:"#ffffff"};
    setElements(prev=>[...prev,item]);setSelectedElement(item.id);setNotice("أُضيف نص جديد. اسحبه داخل المعاينة لتغيير مكانه.");
  }
  function addLogo(file:File|undefined) {
    if(!file)return;
    if(!file.type.startsWith("image/")){setNotice("يرجى اختيار ملف شعار بصيغة صورة.");return;}
    if(file.size>5*1024*1024){setNotice("حجم الشعار أكبر من 5 ميغابايت.");return;}
    const reader=new FileReader();reader.onload=()=>{const item={id:Date.now(),kind:"image" as const,value:String(reader.result||""),x:50,y:50,size:72,color:"#ffffff"};setElements(prev=>[...prev,item]);setSelectedElement(item.id);setNotice("تمت إضافة الشعار؛ اسحبه إلى المكان المطلوب.");};reader.readAsDataURL(file);
  }
  function updateSelected(patch:Partial<ElementItem>) {setElements(prev=>prev.map(e=>e.id===selectedElement?{...e,...patch}:e));}
  function exportSvg() {
    const blob=new Blob([svg],{type:"image/svg+xml;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="rokn-custom-design.svg";a.click();URL.revokeObjectURL(url);
    setNotice("تم تنزيل نموذج SVG الأساسي. ملاحظة: العناصر الإضافية والصور لا تُدمج في هذا الملف حتى الآن.");
  }
  function reset() {setTemplateId("shield");setTitle("شكر وتقدير");setSubtitle("تقديرًا لجهودكم وعطائكم");setRecipient("يُكتب الاسم هنا");setColor("#173b53");setAccent("#d7b56d");setMaterial("أكريليك وخشب");setSize(sizes[1]);setQuantity("1");setNotes("");setElements([{id:1,kind:"text",value:"شكر وتقدير",x:50,y:42,size:23,color:"#d7b56d"},{id:2,kind:"text",value:"يُكتب الاسم هنا",x:50,y:55,size:17,color:"#ffffff"},{id:3,kind:"text",value:"تقديرًا لجهودكم وعطائكم",x:50,y:67,size:13,color:"#d7b56d"}]);setSelectedElement(1);setNotice("تمت إعادة الإعدادات إلى القيم الافتراضية.");}
  function requestQuote() {
    const subject=encodeURIComponent("طلب عرض سعر - ركن للأعمال الفنية");
    const body=encodeURIComponent("طلب تصميم جديد\nالمنتج: "+current.name+"\nالعنوان: "+title+"\nالاسم: "+recipient+"\nالنص الإضافي: "+subtitle+"\nالخامة: "+material+"\nالمقاس: "+size+"\nالكمية: "+quantity+"\nملاحظات: "+(notes||"لا توجد")+"\nيرجى التواصل لتأكيد السعر والعربون.");
    window.location.href="mailto:info@rokn-art-works.com?subject="+subject+"&body="+body;
  }
  function sendWhatsApp() {
    const phone=customer.phone.trim().replace(/[^\d]/g,"");
    if(!customer.name.trim()||!phone){setNotice("أدخل اسمك ورقم هاتفك أولًا.");return;}
    let target="";
    try {target=localStorage.getItem("rokn-whatsapp-number")||"";}catch{}
    if(!target){setNotice("لم يُحدد رقم واتساب الاستقبال من إعدادات الإدارة بعد. سنجهز الطلب دون إرساله.");return;}
    const message="طلب حجز جديد - ركن للأعمال الفنية\nالعميل: "+customer.name+"\nهاتف العميل: "+phone+"\nالمنتج: "+current.name+"\nالخامة: "+material+"\nالمقاس: "+size+"\nالكمية: "+quantity+"\nالعربون المقترح: "+(customer.deposit||"يحدد بعد التسعير")+"\nملاحظات: "+(notes||"لا توجد")+"\nحالة الدفع: بانتظار تأكيد الإدارة";
    window.open("https://wa.me/"+target.replace(/[^\d]/g,"")+"?text="+encodeURIComponent(message),"_blank","noopener,noreferrer");
    setNotice("تم تجهيز رسالة واتساب. هذا لا يؤكد دفع العربون؛ يجب التحقق من الدفع يدويًا.");
  }

  return <main className="editor-shell" dir="rtl">
    <header className="editor-top"><div className="editor-title"><Link href="/" className="brand-mark">ر</Link><div><h1>استوديو تصميم ركن</h1><p>صمّم معاينتك، أضف الشعارات والنصوص، ثم جهّز طلبك</p></div></div><Link href="/" className="btn secondary"><ArrowRight size={16}/> العودة للمتجر</Link></header>
    <div className="editor-layout">
      <section className="editor-panel"><h3><Layers3 size={17} style={{display:"inline",verticalAlign:"middle",marginLeft:7}}/> 1. المنتج والخامات</h3>
        {templates.map(t=><button type="button" key={t.id} className={"editor-template "+(templateId===t.id?"selected":"")} onClick={()=>setTemplateId(t.id)}><span className="template-icon"><Sparkles size={18}/></span><span style={{flex:1}}><b>{t.name}</b><small>{t.description}</small></span>{templateId===t.id&&<span style={{color:"#376b88"}}>✓</span>}</button>)}
        <label className="field-label">صورة العرض الرئيسية</label><label className="btn secondary" style={{display:"flex",justifyContent:"center",gap:8}}><ImagePlus size={16}/> اختيار صورة العرض<input type="file" accept="image/*" hidden onChange={e=>readImage(e.target.files?.[0],setMainImage)}/></label>
        <label className="field-label">صورة القالب المستخدم</label><label className="btn secondary" style={{display:"flex",justifyContent:"center",gap:8}}><Upload size={16}/> اختيار صورة القالب<input type="file" accept="image/*" hidden onChange={e=>readImage(e.target.files?.[0],setTemplateImage)}/></label>
        {templateImage&&<button className="btn secondary" onClick={()=>setTemplateImage("")}>إزالة صورة القالب</button>}
        <label className="field-label" htmlFor="material">الخامة المقترحة</label><select id="material" value={material} onChange={e=>setMaterial(e.target.value)}>{materials.map(m=><option key={m}>{m}</option>)}</select>
        <label className="field-label" htmlFor="size"><Ruler size={14} style={{display:"inline",verticalAlign:"middle",marginLeft:5}}/> المقاس</label><select id="size" value={size} onChange={e=>setSize(e.target.value)}>{sizes.map(s=><option key={s}>{s}</option>)}</select>
        <label className="field-label" htmlFor="quantity">الكمية المطلوبة</label><input id="quantity" type="number" min="1" max="10000" value={quantity} onChange={e=>setQuantity(e.target.value)}/>
        <p className="editor-help">صور التحميل تظهر في المعاينة الحالية فقط؛ حفظها الدائم وإدارتها من لوحة الإدارة يحتاجان تخزينًا على الخادم.</p>
      </section>
      <section className="editor-stage"><div className="stage-toolbar"><span>معاينة التصميم</span><span>اسحب النصوص والشعارات لتغيير مواقعها</span></div>
        {mainImage&&<div style={{margin:12}}><b style={{display:"block",marginBottom:6}}>صورة العرض الرئيسية</b><img src={mainImage} alt="صورة العرض الرئيسية" style={{width:"100%",maxHeight:180,objectFit:"contain",borderRadius:10,background:"#fff"}}/></div>}
        <div className="stage-canvas" onPointerMove={e=>{if(draggingElement===null)return;const rect=e.currentTarget.getBoundingClientRect();setElements(prev=>prev.map(item=>item.id===draggingElement?{...item,x:Math.max(3,Math.min(97,((e.clientX-rect.left)/rect.width)*100)),y:Math.max(3,Math.min(97,((e.clientY-rect.top)/rect.height)*100))}:item));}} onPointerUp={()=>setDraggingElement(null)} onPointerCancel={()=>setDraggingElement(null)}>
          {templateImage?<img src={templateImage} alt="القالب المختار" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",pointerEvents:"none"}}/>:<div className={"stage-product "+current.shape} style={{background:"linear-gradient(145deg,"+color+",#102b43)"}}><div className="stage-inner" style={{borderColor:accent}}><span style={{color:accent,fontSize:10,letterSpacing:1}}>ROKN · CUSTOM MADE</span><strong style={{color:accent}}>{title||"عنوان التصميم"}</strong><i style={{background:accent}}/><span>{recipient||"اسم المكرّم"}</span><span style={{color:accent,fontSize:12}}>{subtitle}</span></div></div>}
          {elements.map(item=><div key={item.id} onPointerDown={e=>{e.preventDefault();e.stopPropagation();setSelectedElement(item.id);setDraggingElement(item.id);(e.currentTarget.parentElement as HTMLElement|null)?.setPointerCapture?.(e.pointerId);}} onClick={()=>setSelectedElement(item.id)} style={{position:"absolute",left:item.x+"%",top:item.y+"%",transform:"translate(-50%,-50%)",cursor:draggingElement===item.id?"grabbing":"grab",zIndex:selectedElement===item.id?5:3,outline:selectedElement===item.id?"2px dashed #d7b56d":"none",padding:5,color:item.color,fontSize:item.size,textShadow:item.kind==="text"?"0 1px 3px #000":"none",maxWidth:"90%",textAlign:"center",touchAction:"none",userSelect:"none"}}>{item.kind==="text"?item.value:<img src={item.value} alt="شعار مضاف" style={{width:item.size,height:item.size,objectFit:"contain",display:"block"}}/>}</div>)}
        </div>
        <div className="stage-toolbar"><span>الخامة: {material}</span><span>{size}</span></div>
      </section>
      <section className="editor-panel"><h3>2. النصوص والشعارات</h3>
        <button className="btn secondary" style={{width:"100%",justifyContent:"center"}} onClick={addText}><Plus size={16}/> إضافة نص</button>
        <div style={{marginTop:12,marginBottom:12}}><label className="field-label" style={{display:"block",marginBottom:8}}>إضافة شعار أو صورة إلى التصميم</label><label className="btn primary" style={{width:"100%",justifyContent:"center",gap:8,cursor:"pointer"}}><ImagePlus size={17}/> اضغط هنا لرفع الشعار أو الصورة<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>{addLogo(e.target.files?.[0]);e.currentTarget.value="";}} style={{position:"absolute",width:1,height:1,opacity:0,pointerEvents:"none"}}/></label><p className="editor-help">اختر صورة من جهازك، ثم اسحبها داخل المعاينة لتحديد مكانها.</p></div>
        {elements.map(item=><div key={item.id} style={{border:"1px solid #e5eaf0",borderRadius:10,padding:10,marginTop:9,background:selectedElement===item.id?"#f5f8fb":"#fff"}}><div style={{display:"flex",alignItems:"center",gap:8}}><button className="btn secondary" onClick={()=>setSelectedElement(item.id)}>{item.kind==="text"?<Type size={14}/>:<ImagePlus size={14}/>} تحديد العنصر</button><span style={{flex:1,fontSize:12}}>{item.kind==="text"?"نص":"شعار / صورة"}</span><button className="btn secondary" aria-label="حذف العنصر" onClick={()=>{setElements(prev=>prev.filter(x=>x.id!==item.id));if(selectedElement===item.id)setSelectedElement(0);}}><Trash2 size={14}/></button></div>
          {item.kind==="text"&&<input aria-label="محتوى النص" value={item.value} onChange={e=>setElements(prev=>prev.map(x=>x.id===item.id?{...x,value:e.target.value}:x))} style={{marginTop:8}}/>}
          {selectedElement===item.id&&<><label className="field-label">حجم العنصر</label><input type="range" min="10" max="60" value={item.size} onChange={e=>updateSelected({size:Number(e.target.value)})}/>{item.kind==="text"&&<><label className="field-label">لون النص</label><input type="color" value={item.color} onChange={e=>updateSelected({color:e.target.value})}/></>}<p className="editor-help">الموضع الأفقي: {Math.round(item.x)}% · العمودي: {Math.round(item.y)}%</p></>}
        </div>)}
        <h3 style={{marginTop:22}}>3. تفاصيل المنتج</h3>
        <label className="field-label" htmlFor="title">العنوان الرئيسي</label><input id="title" maxLength={80} value={title} onChange={e=>setTitle(e.target.value)} placeholder="شكر وتقدير"/>
        <label className="field-label" htmlFor="recipient">اسم الشخص أو الجهة</label><input id="recipient" maxLength={100} value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="الاسم أو الجهة"/>
        <label className="field-label" htmlFor="subtitle">النص الإضافي</label><textarea id="subtitle" maxLength={180} rows={3} value={subtitle} onChange={e=>setSubtitle(e.target.value)} placeholder="عبارة قصيرة أو تاريخ المناسبة"/>
        <label className="field-label">الألوان</label><div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}><label style={{fontSize:11,color:"#6d7c8c"}}>لون القاعدة <input aria-label="لون القاعدة" type="color" value={color} onChange={e=>setColor(e.target.value)} style={{display:"block",width:44,height:36,border:0,background:"none"}}/></label><label style={{fontSize:11,color:"#6d7c8c"}}>لون الزخرفة <input aria-label="لون الزخرفة" type="color" value={accent} onChange={e=>setAccent(e.target.value)} style={{display:"block",width:44,height:36,border:0,background:"none"}}/></label></div>
        <label className="field-label" htmlFor="notes">ملاحظات للتنفيذ</label><textarea id="notes" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="طريقة التعليق، موعد المناسبة..."/>
        <div className="editor-actions"><button className="btn primary" onClick={()=>setShowBooking(true)}><ShoppingBag size={16}/> متابعة للحجز</button><button className="btn secondary" onClick={requestQuote}><Mail size={16}/> طلب عرض سعر بالبريد</button><button className="btn secondary" onClick={exportSvg}><Download size={16}/> تنزيل SVG</button><button className="btn secondary" onClick={reset}><RotateCcw size={15}/> إعادة الضبط</button></div>
        {notice&&<p className="editor-help" role="status">{notice}</p>}
      </section>
    </div>
    {showBooking&&<div role="dialog" aria-modal="true" aria-label="تأكيد الحجز" style={{position:"fixed",inset:0,zIndex:1000,background:"#102b43b8",display:"grid",placeItems:"center",padding:16}}><section className="editor-panel" style={{width:"min(560px,100%)",maxHeight:"90vh",overflow:"auto",boxShadow:"0 20px 70px #0003"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><h2>تأكيد طلب الحجز</h2><button className="btn secondary" onClick={()=>setShowBooking(false)}>إغلاق</button></div><p>المنتج: {current.name} · الكمية: {quantity}</p><p>الخامة: {material} · المقاس: {size}</p><label className="field-label">الاسم الكامل</label><input required value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} placeholder="اسم صاحب الطلب"/><label className="field-label">رقم هاتفك للتواصل</label><input required value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})} placeholder="رقم الهاتف مع مفتاح الدولة"/><label className="field-label">قيمة العربون المتفق عليه (إن وُجد)</label><input value={customer.deposit} onChange={e=>setCustomer({...customer,deposit:e.target.value})} placeholder="يحدد بعد تأكيد السعر"/><div style={{padding:12,background:"#f6f8fb",borderRadius:10,marginTop:12}}><b>طرق الدفع وحالة العربون</b><p style={{marginBottom:4}}>تُحدد طريقة الدفع وقيمة العربون مع الإدارة بعد مراجعة السعر. لا تُعتبر هذه الصفحة إثباتًا للدفع، ويجب التحقق من وصول العربون قبل تأكيده.</p></div><button className="btn primary" style={{width:"100%",justifyContent:"center",marginTop:14}} onClick={sendWhatsApp}>تجهيز الطلب وإرساله إلى واتساب</button><p className="editor-help">يلزم إعداد رقم واتساب الاستقبال في لوحة الإدارة. إذا لم يُضبط الرقم، لن يتم إرسال الطلب.</p></section></div>}
    <p className="editor-help" style={{marginTop:18}}>تنبيه: هذا الإصدار يدعم معاينة الصور وإضافة عناصر متعددة وتحريكها بالسحب. الحفظ الدائم للصور والتصاميم، وربط الطلبات بقاعدة بيانات، ووسائل الدفع الإلكترونية، والإشعارات الفعلية ما زالت بحاجة إلى إعداد الخادم.</p>
  </main>;
}
