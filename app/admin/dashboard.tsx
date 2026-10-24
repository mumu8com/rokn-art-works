"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowDownLeft, ArrowUpLeft, Bell, Box, CheckCircle2, ChevronLeft, CircleHelp, CreditCard, FileImage, FolderKanban, Gauge, LayoutGrid, LogOut, Menu, MessageSquare, Package, Plus, Search, Settings, ShoppingBag, Sparkles, Users, X } from "lucide-react";

type Product = { id: number; name: string; category: string; price: string; status: "منشور" | "مسودة"; description: string };
type StoreOrder = {id:string;customerName:string;phone:string;email:string;productId:number|null;productName:string;quantity:number;details:string;status:string;createdAt:string};
type StoreQuote = StoreOrder & {estimatedPrice:string};
type DesignBackground = {id:string;templateId:string;title:string;image:string;createdAt?:string;placementX?:number;placementY?:number;placementWidth?:number;placementHeight?:number};
const initialProducts: Product[] = [
  {id:1,name:"درع تكريمي كلاسيكي",category:"دروع",price:"حسب الطلب",status:"منشور",description:"درع أكريليك وخشب مع نقش مخصص"},
  {id:2,name:"ميدالية مناسبات",category:"ميداليات",price:"حسب الطلب",status:"منشور",description:"ميدالية بتصميم وألوان حسب اختيار العميل"},
  {id:3,name:"لوحة تذكارية مؤسسية",category:"لوحات",price:"حسب الطلب",status:"مسودة",description:"لوحة مخصصة للشركات والفعاليات"},
];
const defaultCategories = ["دروع","ميداليات","هدايا","لوحات","ديكور","شعارات","أخرى"];
const navItems = [
  {id:"overview",label:"نظرة عامة",icon:Gauge},
  {id:"categories",label:"الأصناف",icon:FolderKanban},
  {id:"products",label:"المنتجات",icon:Package},
  {id:"designs",label:"القوالب",icon:FileImage},
  {id:"orders",label:"الطلبات",icon:ShoppingBag},
  {id:"customers",label:"العملاء",icon:Users},
  {id:"quotes",label:"عروض الأسعار",icon:CreditCard},
  {id:"messages",label:"رسائل العملاء",icon:MessageSquare},
  {id:"settings",label:"الإعدادات",icon:Settings},
];

export default function AdminDashboard() {
  const router = useRouter();
  const [active, setActive] = useState("overview");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders,setOrders] = useState<StoreOrder[]>([]);
  const [quotes,setQuotes] = useState<StoreQuote[]>([]);
  const [newQuoteCount,setNewQuoteCount] = useState(0);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [newCategory, setNewCategory] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({name:"",category:"دروع",price:"حسب الطلب",description:""});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  type DesignTemplate = {id:string;title:string;category:string;description:string;image:string;published:boolean;contentMode:"both"|"image"|"text";textX:number;textY:number;imageX:number;imageY:number};
  const [designTemplates,setDesignTemplates] = useState<DesignTemplate[]>([]);
  const [templateForm,setTemplateForm] = useState<DesignTemplate>({id:"",title:"",category:"دروع",description:"",image:"",published:true,contentMode:"both",textX:50,textY:58,imageX:50,imageY:50});
  const [templateFormOpen,setTemplateFormOpen] = useState(false);
  const [templateSaving,setTemplateSaving] = useState(false);
  const [backgroundTemplateId,setBackgroundTemplateId] = useState("");
  const [backgroundTitle,setBackgroundTitle] = useState("");
  const [backgroundImage,setBackgroundImage] = useState("");
  const [designBackgrounds,setDesignBackgrounds] = useState<DesignBackground[]>([]);
  const [backgroundSaving,setBackgroundSaving] = useState(false);
  const [backgroundLoading,setBackgroundLoading] = useState(false);
  const [baseTitle,setBaseTitle] = useState("");
  const [baseImage,setBaseImage] = useState("");
  const [designBases,setDesignBases] = useState<DesignBackground[]>([]);
  const [baseSaving,setBaseSaving] = useState(false);
  const [baseLoading,setBaseLoading] = useState(false);

  useEffect(() => {
    try {
      const savedCategories = localStorage.getItem("rokn-admin-categories"); if (savedCategories) { const parsed = JSON.parse(savedCategories); if (Array.isArray(parsed) && parsed.every(x => typeof x === "string")) setCategories(Array.from(new Set([...defaultCategories, ...parsed]))); }
      setWhatsappNumber(localStorage.getItem("rokn-whatsapp-number") || "");
      const savedProducts = localStorage.getItem("rokn-admin-products");
      fetch("/api/products").then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "تعذر تحميل المنتجات");
        if (Array.isArray(data.products) && data.products.length) {
          setProducts(data.products);
          try { localStorage.setItem("rokn-admin-products",JSON.stringify(data.products)); } catch {}
        } else {
          const legacy = savedProducts ? JSON.parse(savedProducts) : initialProducts;
          const migration = Array.isArray(legacy) && legacy.length ? legacy : initialProducts;
          const migrated = await fetch("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({products:migration})});
          const migratedData = await migrated.json();
          if (!migrated.ok) throw new Error(migratedData.error || "تعذر نقل المنتجات القديمة");
          setProducts(migratedData.products || []);
          try { localStorage.setItem("rokn-admin-products",JSON.stringify(migratedData.products || [])); } catch {}
          setNotice("تم نقل قائمة المنتجات إلى قاعدة البيانات المشتركة.");
        }
      }).catch(error=>setNotice(error instanceof Error?error.message:"تعذر تحميل المنتجات من قاعدة البيانات."));
      fetch("/api/orders").then(async r=>{const d=await r.json();if(r.ok)setOrders(d.orders||[]);}).catch(()=>{});
    } catch {}
    fetch("/api/design-templates").then(async r=>{const data=await r.json();if(r.ok){const templates=data.templates||[];setDesignTemplates(templates);if(templates.length)setBackgroundTemplateId(templates[0].id);}}).catch(()=>{});
  }, []);

  useEffect(() => {
    let cancelled = false;
    let initialized = false;
    let knownQuoteIds = new Set<string>();
    const refreshQuotes = async () => {
      try {
        const response = await fetch("/api/quotes", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.quotes) || cancelled) return;
        const latest = data.quotes as StoreQuote[];
        const latestIds = new Set(latest.map(q => q.id));
        if (initialized) {
          const fresh = latest.filter(q => !knownQuoteIds.has(q.id));
          if (fresh.length) {
            setNewQuoteCount(count => count + fresh.length);
            setNotice(fresh.length === 1
              ? "وصل طلب عرض سعر جديد من " + fresh[0].customerName + ". افتح قسم عروض الأسعار لمراجعته."
              : "وصلت " + fresh.length + " طلبات عروض أسعار جديدة. افتح قسم عروض الأسعار لمراجعتها.");
          }
        }
        knownQuoteIds = latestIds;
        initialized = true;
        setQuotes(latest);
      } catch {
        // Keep the last successful list visible if a refresh temporarily fails.
      }
    };
    void refreshQuotes();
    const timer = window.setInterval(refreshQuotes, 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  function saveCategories(next: string[]) {
    const clean = Array.from(new Set(next.map(c => c.trim()).filter(Boolean)));
    try { localStorage.setItem("rokn-admin-categories", JSON.stringify(clean)); setCategories(clean); setNotice("تم حفظ الأصناف في هذا المتصفح. اختر الصنف عند إضافة منتج أو قالب."); }
    catch { setNotice("تعذر حفظ الأصناف في هذا المتصفح."); }
  }
  function addCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const value = newCategory.trim();
    if (!value) { setNotice("اكتب اسم الصنف أولًا."); return; }
    if (categories.some(c => c.toLowerCase() === value.toLowerCase())) { setNotice("هذا الصنف موجود بالفعل."); return; }
    saveCategories([...categories, value]); setNewCategory("");
  }
  function removeCategory(value: string) {
    if (defaultCategories.includes(value)) { setNotice("لا يمكن حذف الأصناف الأساسية."); return; }
    if (products.some(p => p.category === value) || designTemplates.some(t => t.category === value)) { setNotice("لا يمكن حذف صنف مرتبط بمنتج أو قالب. غيّر تصنيف العناصر المرتبطة أولًا."); return; }
    saveCategories(categories.filter(c => c !== value));
  }
  async function saveProducts(next: Product[]): Promise<boolean> {
    try {
      const response = await fetch("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({products:next})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر حفظ المنتجات");
      const saved = data.products as Product[];
      setProducts(current => {
        const returnedIds = new Set(saved.map(p=>p.id));
        return [...saved,...current.filter(p=>!returnedIds.has(p.id)&&next.some(n=>n.id===p.id))];
      });
      try { localStorage.setItem("rokn-admin-products",JSON.stringify(next)); } catch {}
      setNotice("تم حفظ المنتجات في قاعدة البيانات المشتركة.");
      return true;
    } catch (error) {
      setNotice(error instanceof Error?error.message:"تعذر حفظ المنتجات في قاعدة البيانات.");
      return false;
    }
  }
  async function addProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) { setNotice("يرجى إدخال اسم المنتج."); return; }
    const next = editingId === null
      ? [{...form,id:Date.now(),status:"مسودة" as const},...products]
      : products.map(p => p.id === editingId ? {...p,...form} : p);
    if (await saveProducts(next)) {
      setForm({name:"",category:"دروع",price:"حسب الطلب",description:""});
      setEditingId(null);
      setShowForm(false);
    }
  }
  async function toggleProductStatus(id: number) {
    await saveProducts(products.map(p => p.id === id ? {...p,status:p.status === "منشور" ? "مسودة" : "منشور"} : p));
  }
  async function deleteProduct(id:number) {
    try {
      const response=await fetch("/api/products?id="+encodeURIComponent(id),{method:"DELETE"});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"تعذر حذف المنتج");
      setProducts(current=>current.filter(p=>p.id!==id));
      setNotice("تم حذف المنتج من قاعدة البيانات.");
    } catch(error) { setNotice(error instanceof Error?error.message:"تعذر حذف المنتج."); }
  }
  async function updateOrderStatus(order:StoreOrder,status:string) {
    const response=await fetch("/api/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:order.id,status})});
    const data=await response.json(); if(!response.ok){setNotice(data.error||"تعذر تحديث الطلب");return;}
    setOrders(items=>items.map(item=>item.id===order.id?{...item,status}:item));setNotice("تم تحديث حالة الطلب.");
  }
  async function updateQuoteStatus(quote:StoreQuote,status:string) {
    const estimatedPrice=window.prompt("أدخل السعر أو تفاصيل العرض (اختياري):",quote.estimatedPrice||"");
    if(estimatedPrice===null)return;
    const response=await fetch("/api/quotes",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:quote.id,status,estimatedPrice})});
    const data=await response.json(); if(!response.ok){setNotice(data.error||"تعذر تحديث عرض السعر");return;}
    setQuotes(items=>items.map(item=>item.id===quote.id?{...item,status,estimatedPrice}:item));setNotice("تم تحديث عرض السعر.");
  }
  function notifyQuoteCustomer(quote: StoreQuote) {
    const digits = quote.phone
      .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) {
      setNotice("رقم هاتف العميل غير صالح لإعداد رابط واتساب. راجع الرقم قبل التواصل.");
      return;
    }
    const priceLine = quote.estimatedPrice ? "\nتفاصيل العرض: " + quote.estimatedPrice : "";
    const message = "مرحبًا " + quote.customerName + "، بخصوص طلب عرض السعر لمنتج " + quote.productName +
      " (رقم المتابعة: " + quote.id + "). حالة الطلب: " + quote.status + "." + priceLine +
      "\nيسعدنا الرد على أي استفسار. — ركن للأعمال الفنية";
    window.open("https://wa.me/" + digits + "?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
    setNotice("تم فتح واتساب برسالة جاهزة للعميل. راجع الرسالة واضغط إرسال داخل واتساب لإتمام الإشعار.");
  }
  async function logout() {
    await fetch("/api/admin/logout", {method:"POST"});
    router.replace("/admin/login");
    router.refresh();
  }
  async function saveDesignTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!templateForm.title.trim()) { setNotice("يرجى إدخال اسم القالب."); return; }
    setTemplateSaving(true);
    try {
      const response=await fetch("/api/design-templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(templateForm)});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||"تعذر حفظ القالب");
      setDesignTemplates(prev=>[data.template,...prev.filter(t=>t.id!==data.template.id)]);
      setTemplateForm({id:"",title:"",category:"دروع",description:"",image:"",published:true,contentMode:"both",textX:50,textY:58,imageX:50,imageY:50});
      setTemplateFormOpen(false);
      setNotice("تم حفظ القالب في قاعدة البيانات المشتركة، وسيظهر في استوديو التصميم.");
    } catch(err) { setNotice(err instanceof Error?err.message:"تعذر حفظ القالب."); }
    finally { setTemplateSaving(false); }
  }
  function loadTemplateImage(file?: File) {
    if(!file)return;
    if(!file.type.startsWith("image/")) { setNotice("اختر ملف صورة صالحًا."); return; }
    if(file.size>5*1024*1024) { setNotice("الحد الأقصى لحجم الصورة 5 ميغابايت."); return; }
    const reader=new FileReader();
    reader.onload=()=>setTemplateForm(prev=>({...prev,image:String(reader.result||"")}));
    reader.readAsDataURL(file);
  }
  useEffect(() => {
    if (!backgroundTemplateId) { setDesignBackgrounds([]); return; }
    let cancelled = false;
    setBackgroundLoading(true);
    fetch("/api/design-backgrounds?templateId="+encodeURIComponent(backgroundTemplateId))
      .then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||"تعذر تحميل الخلفيات");if(!cancelled)setDesignBackgrounds(data.backgrounds||[]);})
      .catch(err=>{if(!cancelled)setNotice(err instanceof Error?err.message:"تعذر تحميل الخلفيات المحفوظة.");})
      .finally(()=>{if(!cancelled)setBackgroundLoading(false);});
    return ()=>{cancelled=true;};
  }, [backgroundTemplateId]);

  useEffect(() => {
    if (!backgroundTemplateId) { setDesignBases([]); return; }
    let cancelled = false;
    setBaseLoading(true);
    fetch("/api/design-backgrounds?templateId="+encodeURIComponent(backgroundTemplateId)+"&type=base")
      .then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||"تعذر تحميل الأشكال");if(!cancelled)setDesignBases(data.backgrounds||[]);})
      .catch(err=>{if(!cancelled)setNotice(err instanceof Error?err.message:"تعذر تحميل الأشكال المحفوظة.");})
      .finally(()=>{if(!cancelled)setBaseLoading(false);});
    return ()=>{cancelled=true;};
  }, [backgroundTemplateId]);

  function loadBaseImage(file?: File) {
    if(!file)return;
    if(!file.type.startsWith("image/")){setNotice("اختر ملف صورة صالحًا.");return;}
    if(file.size>5*1024*1024){setNotice("الحد الأقصى لحجم الشكل 5 ميغابايت.");return;}
    const reader=new FileReader();
    reader.onload=()=>setBaseImage(String(reader.result||""));
    reader.readAsDataURL(file);
  }
  async function saveDesignBase(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(!backgroundTemplateId){setNotice("أضف قالبًا أولًا ثم اختره لحفظ الأشكال.");return;}
    if(!baseImage){setNotice("اختر صورة الشكل أولًا.");return;}
    setBaseSaving(true);
    try {
      const response=await fetch("/api/design-backgrounds",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({templateId:backgroundTemplateId,title:baseTitle.trim()||"الشكل",image:baseImage,type:"base"})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"تعذر حفظ الشكل");
      setDesignBases(prev=>[data.background,...prev]);
      setBaseTitle("");
      setBaseImage("");
      setNotice("تم حفظ الشكل وربطه بالقالب المحدد فقط.");
    } catch(err) { setNotice(err instanceof Error?err.message:"تعذر حفظ الشكل."); }
    finally { setBaseSaving(false); }
  }
  async function saveAssetPlacement(asset: DesignBackground, type: "background" | "base") {
    const currentList = type === "base" ? designBases : designBackgrounds;
    const latest = currentList.find(item => item.id === asset.id) || asset;
    const placement = { placementX: latest.placementX ?? (type === "base" ? 15 : 0), placementY: latest.placementY ?? (type === "base" ? 20 : 0), placementWidth: latest.placementWidth ?? (type === "base" ? 70 : 100), placementHeight: latest.placementHeight ?? (type === "base" ? 60 : 100) };
    try {
      const response = await fetch("/api/design-backgrounds", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: asset.id, ...placement }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر حفظ موضع الصورة");
      const update = (items: DesignBackground[]) => items.map(item => item.id === asset.id ? { ...item, ...placement } : item);
      if (type === "base") setDesignBases(update); else setDesignBackgrounds(update);
      setNotice("تم حفظ حجم ومكان الصورة؛ سيستخدمهما الاستوديو تلقائيًا عند اختيار العميل لها.");
    } catch (err) { setNotice(err instanceof Error ? err.message : "تعذر حفظ موضع الصورة."); }
  }
  async function deleteDesignBase(id:string) {
    if(!confirm("هل تريد حذف الشكل المحفوظ؟"))return;
    try {
      const response=await fetch("/api/design-backgrounds?id="+encodeURIComponent(id),{method:"DELETE"});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"تعذر حذف الشكل");
      setDesignBases(prev=>prev.filter(bg=>bg.id!==id));
      setNotice("تم حذف الشكل المحفوظ.");
    } catch(err) { setNotice(err instanceof Error?err.message:"تعذر حذف الشكل."); }
  }
  function loadBackgroundImage(file?: File) {
    if(!file)return;
    if(!file.type.startsWith("image/")){setNotice("اختر ملف صورة صالحًا.");return;}
    if(file.size>5*1024*1024){setNotice("الحد الأقصى لحجم الخلفية 5 ميغابايت.");return;}
    const reader=new FileReader();
    reader.onload=()=>setBackgroundImage(String(reader.result||""));
    reader.readAsDataURL(file);
  }
  async function saveDesignBackground(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(!backgroundTemplateId){setNotice("أضف قالبًا أولًا ثم اختره لحفظ خلفياته.");return;}
    if(!backgroundImage){setNotice("اختر صورة الخلفية أولًا.");return;}
    setBackgroundSaving(true);
    try {
      const response=await fetch("/api/design-backgrounds",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({templateId:backgroundTemplateId,title:backgroundTitle.trim()||"خلفية جديدة",image:backgroundImage})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"تعذر حفظ الخلفية");
      setDesignBackgrounds(prev=>[data.background,...prev]);
      setBackgroundTitle("");
      setBackgroundImage("");
      setNotice("تم حفظ الخلفية وربطها بالقالب المحدد فقط.");
    } catch(err) { setNotice(err instanceof Error?err.message:"تعذر حفظ الخلفية."); }
    finally { setBackgroundSaving(false); }
  }
  async function deleteDesignBackground(id:string) {
    if(!confirm("هل تريد حذف صورة الخلفية المحفوظة؟"))return;
    try {
      const response=await fetch("/api/design-backgrounds?id="+encodeURIComponent(id),{method:"DELETE"});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"تعذر حذف الخلفية");
      setDesignBackgrounds(prev=>prev.filter(bg=>bg.id!==id));
      setNotice("تم حذف الخلفية المحفوظة.");
    } catch(err) { setNotice(err instanceof Error?err.message:"تعذر حذف الخلفية."); }
  }
  async function deleteDesignTemplate(id:string) {
    if(!confirm("هل تريد حذف هذا القالب من الاستوديو؟")) return;
    try { const response=await fetch("/api/design-templates?id="+encodeURIComponent(id),{method:"DELETE"});const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذر الحذف");setDesignTemplates(prev=>prev.filter(t=>t.id!==id));setNotice("تم حذف القالب."); }
    catch(err){setNotice(err instanceof Error?err.message:"تعذر حذف القالب.");}
  }
  const filtered = useMemo(() => products.filter(p => (p.name+" "+p.category+" "+p.description).toLowerCase().includes(search.toLowerCase())), [products,search]);
  const current = navItems.find(n=>n.id===active)?.label || "نظرة عامة";

  return <main className="admin-app" dir="rtl">
    <aside className={"admin-sidebar "+(mobileNav?"mobile-open":"")}>
      <div className="admin-brand"><div className="brand-mark">ر</div><div><strong>ركن</strong><span>مساحة إدارة الأعمال</span></div><button className="sidebar-close" onClick={()=>setMobileNav(false)} aria-label="إغلاق القائمة"><X size={18}/></button></div>
      <div className="workspace-chip"><span className="workspace-dot"/><div><b>متجر ركن</b><small>المساحة الرئيسية</small></div><ChevronLeft size={16}/></div>
      <p className="side-label">إدارة المتجر</p>
      <nav className="admin-nav">{navItems.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>{setActive(item.id);setMobileNav(false);if(item.id==="quotes")setNewQuoteCount(0)}} className={active===item.id?"active":""}><Icon size={18}/><span>{item.label}</span>{item.id==="quotes"&&newQuoteCount>0&&<em>{newQuoteCount}</em>}{item.id==="orders"&&<em>{orders.length||0}</em>}</button>})}</nav>
      <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={19}/><b>تحتاج إلى مساعدة؟</b><p>تعرّف على خطوات إدارة متجرك.</p><a href="mailto:info@rokn-art-works.com">تواصل مع الدعم <ArrowDownLeft size={14}/></a></div><button className="logout-button" onClick={logout}><LogOut size={17}/> تسجيل الخروج</button></div>
    </aside>
    {mobileNav&&<button className="nav-scrim" aria-label="إغلاق القائمة" onClick={()=>setMobileNav(false)}/>}
    <section className="admin-main">
      <header className="admin-topbar"><div className="topbar-heading"><button className="mobile-menu" onClick={()=>setMobileNav(true)} aria-label="فتح القائمة"><Menu size={20}/></button><div><div className="breadcrumb">ركن <ChevronLeft size={13}/> لوحة التحكم <ChevronLeft size={13}/> <b>{current}</b></div><h1>{current}</h1></div></div><div className="topbar-actions"><a className="store-link" href="/" target="_blank" rel="noreferrer"><ArrowUpLeft size={16}/> عرض المتجر</a><button className="icon-button" aria-label="الإشعارات" onClick={()=>{setActive("quotes");setNewQuoteCount(0);setNotice(quotes.length?"تم فتح قسم عروض الأسعار.":"لا توجد طلبات عروض أسعار حتى الآن.");}}><Bell size={18}/>{newQuoteCount>0&&<i/>}</button><div className="admin-avatar">م</div><div className="admin-user"><b>مدير المتجر</b><span>صلاحية المدير</span></div></div></header>
      <div className="admin-content">
        {notice&&<div className="admin-notice"><CheckCircle2 size={16}/>{notice}<button onClick={()=>setNotice("")} aria-label="إغلاق"><X size={15}/></button></div>}
        {active==="overview"&&<><div className="welcome-row"><div><span className="eyebrow">ملخص النشاط</span><h2>أهلًا بك في مساحة عملك 👋</h2><p>تابع المنتجات والتصميمات وأحدث حركة المتجر من مكان واحد.</p></div><button className="btn primary" onClick={()=>{setActive("products");setShowForm(true)}}><Plus size={17}/> إضافة منتج</button></div>
          <div className="stats-grid"><Stat icon={ShoppingBag} label="إجمالي الطلبات" value="—" hint="ستظهر عند ربط الطلبات بالخادم" tone="violet"/><Stat icon={Package} label="المنتجات" value={String(products.length)} hint="عناصر في هذه القائمة" tone="blue"/><Stat icon={Users} label="العملاء" value="—" hint="بانتظار قاعدة بيانات العملاء" tone="amber"/><Stat icon={CreditCard} label="المبيعات" value="—" hint="لا توجد بوابة دفع مربوطة" tone="green"/></div>
          <div className="dashboard-grid"><section className="panel recent-panel"><div className="panel-head"><div><h3>المنتجات الأخيرة</h3><p>إدارة سريعة للكتالوج</p></div><button className="text-action" onClick={()=>setActive("products")}>عرض الكل <ChevronLeft size={15}/></button></div><ProductTable products={products.slice(0,4)} onEdit={()=>{setActive("products");setNotice("يمكنك متابعة إدارة المنتجات من قائمة المنتجات.")}}/></section><section className="panel quick-panel"><div className="panel-head"><div><h3>اختصارات سريعة</h3><p>أنجز المهام المتكررة</p></div><Sparkles size={18}/></div><QuickAction icon={Plus} title="إضافة منتج جديد" desc="أضف منتجًا إلى كتالوج المتجر" onClick={()=>{setActive("products");setShowForm(true)}}/><QuickAction icon={FileImage} title="قوالب التصميم" desc="انتقل إلى محرر النماذج" onClick={()=>setActive("designs")}/><QuickAction icon={FolderKanban} title="متابعة الطلبات" desc="عرض مساحة الطلبات" onClick={()=>setActive("orders")}/></section></div>
          <div className="setup-banner"><div className="setup-icon"><Activity size={22}/></div><div><b>خطوة مهمة قبل استقبال الطلبات الفعلية</b><p>القائمة الحالية للمنتجات تحفظ داخل المتصفح. لتشغيل المتجر تجاريًا نحتاج قاعدة بيانات دائمة وربط الطلبات وعروض الأسعار بها.</p></div><span className="status-pill">إعداد مطلوب</span></div>
        </>}
        {active==="categories"&&<><div className="section-intro"><div><h2>إدارة الأصناف</h2><p>الأصناف تنظّم المنتجات، وتُستخدم لتقسيم القوالب إلى لوحات منفصلة داخل استوديو التصميم.</p></div></div><form className="panel product-form" onSubmit={addCategory}><div className="panel-head"><h3>إضافة صنف جديد</h3></div><div className="form-row"><label>اسم الصنف<input required maxLength={80} value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="مثال: هدايا الشركات"/></label><div className="form-actions" style={{alignItems:"end"}}><button className="btn primary" type="submit"><Plus size={16}/> إضافة الصنف</button></div></div></form><section className="panel" style={{marginTop:16}}><div className="panel-head"><div><h3>الأصناف الحالية</h3><p>تظهر الأصناف التي لديها قوالب منشورة كأقسام في الاستوديو.</p></div><span className="status-pill">{categories.length} أصناف</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>{categories.map(category=><article key={category} style={{border:"1px solid #e0e6ed",borderRadius:12,padding:14,display:"flex",alignItems:"center",gap:10}}><FolderKanban size={20}/><div style={{flex:1}}><b>{category}</b><small style={{display:"block",color:"#718096",marginTop:4}}>{designTemplates.filter(t=>t.category===category).length} قوالب · {products.filter(p=>p.category===category).length} منتجات</small></div>{!defaultCategories.includes(category)&&<button className="delete-action" onClick={()=>removeCategory(category)}>حذف</button>}</article>)}</div><p className="editor-help" style={{marginTop:14}}>ملاحظة: إدارة الأصناف محفوظة حاليًا في المتصفح نفسه، أما القوالب المنشورة فتُحفظ في قاعدة البيانات المشتركة. أضف قالبًا للصنف ليظهر كقسم للعملاء.</p></section></>}
        {active==="products"&&<><div className="section-intro"><div><h2>كتالوج المنتجات</h2><p>نظّم منتجاتك وخدماتك الفنية، وأضف وصفًا واضحًا لكل منتج.</p></div><button className="btn primary" onClick={()=>setShowForm(!showForm)}><Plus size={17}/> إضافة منتج</button></div>
          {showForm&&<form className="panel product-form" onSubmit={addProduct}><div className="panel-head"><h3>{editingId === null ? "بيانات المنتج الجديد" : "تعديل بيانات المنتج"}</h3><button type="button" className="icon-button" onClick={()=>{setShowForm(false);setEditingId(null)}} aria-label="إغلاق"><X size={17}/></button></div><label>اسم المنتج<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="مثال: درع تكريمي فاخر"/></label><div className="form-row"><label>التصنيف<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{Array.from(new Set([...categories, form.category])).map(c=><option key={c}>{c}</option>)}</select></label><label>السعر أو آلية التسعير<input value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="حسب الطلب"/></label></div><label>وصف المنتج<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} placeholder="الخامات، الاستخدام، خيارات التخصيص..."/></label><div className="form-actions"><button className="btn primary" type="submit">حفظ المنتج</button><button className="btn secondary" type="button" onClick={()=>{setShowForm(false);setEditingId(null)}}>إلغاء</button></div></form>}
          <section className="panel"><div className="table-toolbar"><div className="search-field"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن منتج..."/></div><span>{filtered.length} منتجات</span></div><ProductTable products={filtered} onEdit={(id)=>{const p=products.find(x=>x.id===id);if(p){setEditingId(id);setForm({name:p.name,category:p.category,price:p.price,description:p.description});setShowForm(true);setNotice("يمكنك تعديل البيانات ثم حفظها؛ لن يُحذف المنتج إذا ألغيت التعديل.")}}} onTogglePublish={toggleProductStatus} onDelete={(id)=>{if(confirm("هل تريد حذف هذا المنتج نهائيًا من قاعدة البيانات؟"))deleteProduct(id)}}/></section>
        </>}
        {active==="orders"&&<section className="panel"><div className="panel-head"><div><h3>طلبات العملاء</h3><p>الطلبات محفوظة في قاعدة البيانات ويمكن متابعة حالتها.</p></div><span className="status-pill">{orders.length} طلب</span></div><div className="table-wrap"><table className="products-table"><thead><tr><th>العميل</th><th>المنتج</th><th>الكمية</th><th>التواصل والتفاصيل</th><th>الحالة</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td><b>{o.customerName}</b><small style={{display:"block"}}>{o.phone}</small></td><td>{o.productName}</td><td>{o.quantity}</td><td>{o.details||"—"}{o.email&&<small style={{display:"block"}}>{o.email}</small>}</td><td><select value={o.status} onChange={e=>updateOrderStatus(o,e.target.value)}>{["جديد","قيد المراجعة","قيد التنفيذ","مكتمل","ملغي"].map(v=><option key={v}>{v}</option>)}</select></td></tr>)}</tbody></table>{orders.length===0&&<div className="table-empty">لا توجد طلبات جديدة حتى الآن.</div>}</div></section>}
        {active==="quotes"&&<section className="panel"><div className="panel-head"><div><h3>طلبات عروض الأسعار</h3><p>راجع مواصفات العميل وحدّث حالة عرض السعر.</p></div><span className="status-pill">{quotes.length} عرض</span></div><div className="table-wrap"><table className="products-table"><thead><tr><th>العميل</th><th>المنتج</th><th>الكمية</th><th>التفاصيل</th><th>السعر / الحالة</th></tr></thead><tbody>{quotes.map(q=><tr key={q.id}><td><b>{q.customerName}</b><small style={{display:"block"}}>{q.phone}</small></td><td>{q.productName}</td><td>{q.quantity}</td><td>{q.details||"—"}</td><td><div>{q.estimatedPrice||"لم يُحدد بعد"}</div><select value={q.status} onChange={e=>updateQuoteStatus(q,e.target.value)} style={{marginTop:6}}>{["بانتظار التسعير","تم إرسال العرض","مقبول","مرفوض","ملغي"].map(v=><option key={v}>{v}</option>)}</select><button className="btn secondary" type="button" style={{marginTop:8}} onClick={()=>notifyQuoteCustomer(q)}>إشعار العميل عبر واتساب</button></td></tr>)}</tbody></table>{quotes.length===0&&<div className="table-empty">لا توجد طلبات عروض أسعار حتى الآن.</div>}</div></section>}
        {active==="settings"&&<section className="panel product-form"><div className="panel-head"><h3>إعدادات استقبال الطلبات</h3></div><p>أدخل رقم واتساب الذي تريد استقبال طلبات التصميم والحجز عليه، مع مفتاح الدولة، دون علامة + أو مسافات. مثال: 2189XXXXXXXX.</p><label>رقم واتساب الاستقبال<input dir="ltr" inputMode="tel" value={whatsappNumber} onChange={e=>setWhatsappNumber(e.target.value)} placeholder="2189XXXXXXXX"/></label><div className="form-actions"><button className="btn primary" onClick={()=>{let normalized=whatsappNumber.replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/\D/g,"");if(normalized.startsWith("00"))normalized=normalized.slice(2);if(normalized.startsWith("0"))normalized="218"+normalized.slice(1);if(normalized.length<10){setNotice("أدخل رقم واتساب صحيحًا مع مفتاح الدولة، مثل 2189XXXXXXXX.");return;}try{localStorage.setItem("rokn-whatsapp-number",normalized);setWhatsappNumber(normalized);setNotice("تم حفظ الرقم بصيغة دولية في هذا المتصفح فقط. يجب استخدام المتصفح نفسه في لوحة الإدارة واستوديو التصميم.");}catch{setNotice("تعذر حفظ الرقم في هذا المتصفح.");}}}>حفظ رقم واتساب</button></div><p className="editor-help">مهم: هذه الإعدادات محفوظة في المتصفح الحالي فقط وليست مشتركة بين أجهزة الإدارة والعملاء بعد.</p></section>}{active==="designs"&&<><div className="section-intro"><div><h2>مكتبة قوالب الاستوديو</h2><p>أضف صور القوالب من جهازك، واكتب اسمها وتصنيفها، ثم انشرها لتظهر مباشرة للعملاء في استوديو التصميم.</p></div><button className="btn primary" onClick={()=>{setTemplateForm({id:"",title:"",category:"دروع",description:"",image:"",published:true,contentMode:"both",textX:50,textY:58,imageX:50,imageY:50});setTemplateFormOpen(v=>!v)}}><Plus size={17}/> إضافة قالب</button></div>
          {templateFormOpen&&<form className="panel product-form" onSubmit={saveDesignTemplate}><div className="panel-head"><h3>{templateForm.id?"تعديل القالب":"إنشاء قالب جديد"}</h3><button type="button" className="icon-button" onClick={()=>setTemplateFormOpen(false)} aria-label="إغلاق"><X size={17}/></button></div>
            <label>اسم القالب<input required maxLength={120} value={templateForm.title} onChange={e=>setTemplateForm({...templateForm,title:e.target.value})} placeholder="مثال: درع تكريمي فاخر"/></label>
            <div className="form-row"><label>التصنيف<select value={templateForm.category} onChange={e=>setTemplateForm({...templateForm,category:e.target.value})}>{Array.from(new Set([...categories, templateForm.category])).map(x=><option key={x}>{x}</option>)}</select></label><label>حالة القالب<select value={templateForm.published?"published":"draft"} onChange={e=>setTemplateForm({...templateForm,published:e.target.value==="published"})}><option value="published">منشور للعملاء</option><option value="draft">مسودة مخفية</option></select></label></div>
            <div className="form-row"><label>محتوى القالب<select value={templateForm.contentMode} onChange={e=>setTemplateForm({...templateForm,contentMode:e.target.value as "both"|"image"|"text"})}><option value="both">صورة ونص معًا</option><option value="image">صورة فقط</option><option value="text">كتابة فقط</option></select></label><div className="editor-help" style={{alignSelf:"end"}}>حدد العناصر التي يسمح للعميل بإضافتها في هذا القالب.</div></div>
            <div className="form-row"><label>موضع النص الأفقي: {templateForm.textX}%<input type="range" min="5" max="95" value={templateForm.textX} onChange={e=>setTemplateForm({...templateForm,textX:Number(e.target.value)})}/></label><label>موضع النص العمودي: {templateForm.textY}%<input type="range" min="5" max="95" value={templateForm.textY} onChange={e=>setTemplateForm({...templateForm,textY:Number(e.target.value)})}/></label></div>
            <div className="form-row"><label>موضع الصورة الأفقي: {templateForm.imageX}%<input type="range" min="5" max="95" value={templateForm.imageX} onChange={e=>setTemplateForm({...templateForm,imageX:Number(e.target.value)})}/></label><label>موضع الصورة العمودي: {templateForm.imageY}%<input type="range" min="5" max="95" value={templateForm.imageY} onChange={e=>setTemplateForm({...templateForm,imageY:Number(e.target.value)})}/></label></div>
            <label>وصف القالب<textarea rows={2} maxLength={500} value={templateForm.description} onChange={e=>setTemplateForm({...templateForm,description:e.target.value})} placeholder="وصف مختصر للقالب"/></label>
            <label>صورة القالب (PNG / JPG / WEBP)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>loadTemplateImage(e.target.files?.[0])}/></label>
            {templateForm.image&&<div style={{marginTop:12}}><img src={templateForm.image} alt="معاينة القالب" style={{width:"100%",maxWidth:320,maxHeight:220,objectFit:"contain",borderRadius:12,background:"#f5f7fa"}}/><button type="button" className="btn secondary" onClick={()=>setTemplateForm({...templateForm,image:""})}>إزالة الصورة</button></div>}
            <p className="editor-help">الصورة تُحفظ مع القالب في قاعدة البيانات المشتركة، وليس في متصفحك فقط. الحد الأقصى 5 ميغابايت.</p>
            <div className="form-actions"><button className="btn primary" type="submit" disabled={templateSaving}>{templateSaving?"جارٍ الحفظ…":"حفظ ونشر القالب"}</button><button className="btn secondary" type="button" onClick={()=>setTemplateFormOpen(false)}>إلغاء</button></div>
          </form>}
          {designTemplates.length===0&&!templateFormOpen&&<div className="panel empty-module"><div className="empty-icon"><FileImage size={25}/></div><h3>لا توجد قوالب محفوظة حتى الآن</h3><p>اضغط «إضافة قالب» لرفع أول صورة. إذا ظهر خطأ اتصال، يلزم ربط قاعدة بيانات PostgreSQL في إعدادات Render.</p><button className="btn primary" onClick={()=>setTemplateFormOpen(true)}>إضافة أول قالب</button></div>}
          <div className="grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16}}>{designTemplates.map(t=><article className="panel" key={t.id} style={{padding:14}}><div style={{height:170,background:"#f4f6f9",borderRadius:12,display:"grid",placeItems:"center",overflow:"hidden"}}>{t.image?<img src={t.image} alt={t.title} style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<FileImage size={36}/>}</div><div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}><b style={{flex:1}}>{t.title}</b><span className="product-status published">{t.published?"منشور":"مسودة"}</span></div><small style={{display:"block",color:"#718096",marginTop:4}}>{t.category}</small><p style={{fontSize:13,color:"#718096"}}>{t.description}</p><div className="row-actions"><button onClick={()=>{setTemplateForm(t);setTemplateFormOpen(true)}}>تعديل</button><button className="delete-action" onClick={()=>deleteDesignTemplate(t.id)}>حذف</button></div></article>)}</div>
          <section className="panel product-form" style={{marginTop:20}}>
            <div className="panel-head"><div><h3>مكتبة صور الخلفية المحفوظة</h3><p>ارفع صور الخلفية من الإدارة واربطها بقالب محدد؛ لن تظهر خلفيات قالب داخل قالب آخر.</p></div></div>
            {designTemplates.length===0?<p className="editor-help">أضف قالبًا أولًا حتى تتمكن من حفظ صور خلفية خاصة به.</p>:<>
              <label>القالب الذي ستُحفظ خلفياته
                <select value={backgroundTemplateId} onChange={e=>{setBackgroundTemplateId(e.target.value);setBackgroundTitle("");setBackgroundImage("");}}>{designTemplates.map(t=><option key={t.id} value={t.id}>{t.title} — {t.category}</option>)}</select>
              </label>
              <form onSubmit={saveDesignBackground}>
                <label>اسم الخلفية<input value={backgroundTitle} maxLength={120} onChange={e=>setBackgroundTitle(e.target.value)} placeholder="مثال: خلفية ذهبية"/></label>
                <label>صورة الخلفية (PNG / JPG / WEBP)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>loadBackgroundImage(e.target.files?.[0])}/></label>
                {backgroundImage&&<div style={{marginTop:10}}><img src={backgroundImage} alt="معاينة الخلفية قبل الحفظ" style={{width:"100%",maxWidth:360,maxHeight:200,objectFit:"contain",borderRadius:10,background:"#f4f6f9"}}/><button type="button" className="btn secondary" onClick={()=>setBackgroundImage("")}>إزالة الصورة المختارة</button></div>}
                <p className="editor-help">تُحفظ الخلفية في قاعدة البيانات المشتركة ضمن القالب المحدد فقط. الحد الأقصى 5 ميغابايت.</p>
                <div className="form-actions"><button className="btn primary" type="submit" disabled={backgroundSaving}>{backgroundSaving?"جارٍ الحفظ…":"حفظ الخلفية للقالب"}</button></div>
              </form>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12,marginTop:18}}>
                {backgroundLoading?<p>جارٍ تحميل الخلفيات…</p>:designBackgrounds.length===0?<p className="editor-help">لا توجد خلفيات محفوظة لهذا القالب حتى الآن.</p>:designBackgrounds.map(bg=><article key={bg.id} style={{border:"1px solid #e0e6ed",borderRadius:11,padding:9,minWidth:0}}><img src={bg.image} alt={bg.title} style={{width:"100%",height:120,objectFit:"contain",borderRadius:8,background:"#f4f6f9"}}/><b style={{display:"block",fontSize:13,marginTop:8,overflowWrap:"anywhere"}}>{bg.title}</b><PlacementFields asset={bg} type="background" onChange={(id,patch)=>setDesignBackgrounds(items=>items.map(item=>item.id===id?{...item,...patch}:item))}/><button className="btn primary" type="button" style={{marginTop:8}} onClick={()=>saveAssetPlacement(bg,"background")}>حفظ الحجم والمكان</button><button className="btn secondary" type="button" style={{marginTop:8}} onClick={()=>deleteDesignBackground(bg.id)}>حذف الخلفية</button></article>)}
              </div>
            </>}
          </section>
          <section className="panel product-form" style={{marginTop:20}}>
            <div className="panel-head"><div><h3>مكتبة الأشكال المحفوظة (القاعدة)</h3><p>ارفع صور القاعدة أو الشكل من الإدارة واربطها بقالب محدد؛ تبقى منفصلة عن صور الخلفية.</p></div></div>
            {designTemplates.length===0?<p className="editor-help">أضف قالبًا أولًا حتى تتمكن من حفظ الأشكال الخاصة به.</p>:<>
              <label>القالب الذي ستُحفظ أشكاله
                <select value={backgroundTemplateId} onChange={e=>{setBackgroundTemplateId(e.target.value);setBaseTitle("");setBaseImage("");}}>{designTemplates.map(t=><option key={t.id} value={t.id}>{t.title} — {t.category}</option>)}</select>
              </label>
              <form onSubmit={saveDesignBase}>
                <label>اسم الشكل<input value={baseTitle} maxLength={120} onChange={e=>setBaseTitle(e.target.value)} placeholder="مثال: قاعدة خشبية مستطيلة"/></label>
                <label>صورة القاعدة / الشكل (PNG / JPG / WEBP)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>loadBaseImage(e.target.files?.[0])}/></label>
                {baseImage&&<div style={{marginTop:10}}><img src={baseImage} alt="معاينة الشكل قبل الحفظ" style={{width:"100%",maxWidth:360,maxHeight:200,objectFit:"contain",borderRadius:10,background:"#f4f6f9"}}/><button type="button" className="btn secondary" onClick={()=>setBaseImage("")}>إزالة الصورة المختارة</button></div>}
                <p className="editor-help">تُحفظ الصور في قاعدة البيانات المشتركة ضمن القالب المحدد فقط. الحد الأقصى 5 ميغابايت.</p>
                <div className="form-actions"><button className="btn primary" type="submit" disabled={baseSaving}>{baseSaving?"جارٍ الحفظ…":"حفظ الشكل للقالب"}</button></div>
              </form>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12,marginTop:18}}>
                {baseLoading?<p>جارٍ تحميل الأشكال…</p>:designBases.length===0?<p className="editor-help">لا توجد أشكال محفوظة لهذا القالب حتى الآن.</p>:designBases.map(bg=><article key={bg.id} style={{border:"1px solid #e0e6ed",borderRadius:11,padding:9,minWidth:0}}><img src={bg.image} alt={bg.title} style={{width:"100%",height:120,objectFit:"contain",borderRadius:8,background:"#f4f6f9"}}/><b style={{display:"block",fontSize:13,marginTop:8,overflowWrap:"anywhere"}}>{bg.title}</b><PlacementFields asset={bg} type="base" onChange={(id,patch)=>setDesignBases(items=>items.map(item=>item.id===id?{...item,...patch}:item))}/><button className="btn primary" type="button" style={{marginTop:8}} onClick={()=>saveAssetPlacement(bg,"base")}>حفظ الحجم والمكان</button><button className="btn secondary" type="button" style={{marginTop:8}} onClick={()=>deleteDesignBase(bg.id)}>حذف الشكل</button></article>)}
              </div>
            </>}
          </section>
        </>}
        {active!=="overview"&&active!=="categories"&&active!=="products"&&active!=="settings"&&active!=="designs"&&active!=="orders"&&active!=="quotes"&&<section className="panel empty-module"><div className="empty-icon"><LayoutGrid size={25}/></div><h2>{current}</h2><p>{active==="orders"?"ستظهر الطلبات وحالات التنفيذ ومواعيد التسليم بعد ربط قاعدة بيانات الطلبات.":active==="customers"?"سيُعرض ملف كل عميل وسجل طلباته عند تفعيل تخزين بيانات العملاء.":active==="quotes"?"تجهيز عروض الأسعار وربطها بأرقام الطلبات والفواتير.":"تنظيم استفسارات العملاء ومتابعة الردود."}</p><span className="status-pill">قسم جاهز للتطوير</span><div className="empty-module-actions"><button className="btn primary" onClick={()=>setActive("products")}>العودة إلى المنتجات</button><a className="btn secondary" href="mailto:info@rokn-art-works.com">التواصل مع فريق التطوير</a></div></section>}
        <footer className="admin-footer">© {new Date().getFullYear()} ركن للأعمال الفنية <span>لوحة الإدارة · نسخة أولية</span></footer>
      </div>
    </section>
  </main>;
}

function PlacementFields({asset,type,onChange}:{asset:DesignBackground;type:"background"|"base";onChange:(id:string,patch:Partial<DesignBackground>)=>void}) {
  const defaults = type === "base" ? {placementX:15,placementY:20,placementWidth:70,placementHeight:60} : {placementX:0,placementY:0,placementWidth:100,placementHeight:100};
  const fields = [{key:"placementX" as const,label:"الموضع الأفقي %",value:asset.placementX??defaults.placementX},{key:"placementY" as const,label:"الموضع العمودي %",value:asset.placementY??defaults.placementY},{key:"placementWidth" as const,label:"العرض %",value:asset.placementWidth??defaults.placementWidth},{key:"placementHeight" as const,label:"الارتفاع %",value:asset.placementHeight??defaults.placementHeight}];
  return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginTop:10}}>{fields.map(field=><label key={field.key} style={{fontSize:11,color:"#526273"}}>{field.label}<input type="number" min="0" max="100" value={field.value} onChange={e=>onChange(asset.id,{[field.key]:Number(e.target.value)})} style={{display:"block",width:"100%",marginTop:4,padding:"7px",border:"1px solid #dce3ea",borderRadius:7}}/></label>)}<small style={{gridColumn:"1 / -1",color:"#718096"}}>النسب من مساحة التصميم. اترك هامشًا بحيث لا يتجاوز الموضع + الحجم 100%.</small></div>;
}
function Stat({icon:Icon,label,value,hint,tone}:{icon:typeof Package;label:string;value:string;hint:string;tone:string}){return <article className="stat-card"><div className={"stat-icon "+tone}><Icon size={19}/></div><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>}
function QuickAction({icon:Icon,title,desc,onClick}:{icon:typeof Package;title:string;desc:string;onClick:()=>void}){return <button className="quick-action" onClick={onClick}><span><Icon size={18}/></span><div><b>{title}</b><small>{desc}</small></div><ChevronLeft size={16}/></button>}
function ProductTable({products,onEdit,onDelete,onTogglePublish}:{products:Product[];onEdit:(id:number)=>void;onDelete?:(id:number)=>void;onTogglePublish?:(id:number)=>void}){return <div className="table-wrap"><table className="products-table"><thead><tr><th>المنتج</th><th>التصنيف</th><th>السعر</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><div className="product-cell"><div className="product-thumb"><Box size={19}/></div><div><b>{p.name}</b><small>{p.description||"بدون وصف"}</small></div></div></td><td>{p.category}</td><td>{p.price}</td><td><span className={"product-status "+(p.status==="منشور"?"published":"draft")}>{p.status}</span></td><td><div className="row-actions"><button onClick={()=>onEdit(p.id)}>تعديل</button>{onTogglePublish&&<button onClick={()=>onTogglePublish(p.id)}>{p.status==="منشور"?"إرجاع لمسودة":"نشر"}</button>}{onDelete&&<button className="delete-action" onClick={()=>onDelete(p.id)}>حذف</button>}</div></td></tr>)}</tbody></table>{products.length===0&&<div className="table-empty">لا توجد منتجات مطابقة لبحثك.</div>}</div>}