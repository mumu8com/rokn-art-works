"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowDownLeft, ArrowUpLeft, Bell, Box, CheckCircle2, ChevronLeft, CircleHelp, CreditCard, FileImage, FolderKanban, Gauge, LayoutGrid, LogOut, Menu, MessageSquare, Package, Plus, Search, Settings, ShoppingBag, Sparkles, Users, X } from "lucide-react";

type Product = { id: number; name: string; category: string; price: string; status: "منشور" | "مسودة"; description: string };
const initialProducts: Product[] = [
  {id:1,name:"درع تكريمي كلاسيكي",category:"دروع",price:"حسب الطلب",status:"منشور",description:"درع أكريليك وخشب مع نقش مخصص"},
  {id:2,name:"ميدالية مناسبات",category:"ميداليات",price:"حسب الطلب",status:"منشور",description:"ميدالية بتصميم وألوان حسب اختيار العميل"},
  {id:3,name:"لوحة تذكارية مؤسسية",category:"لوحات",price:"حسب الطلب",status:"مسودة",description:"لوحة مخصصة للشركات والفعاليات"},
];
const navItems = [
  {id:"overview",label:"نظرة عامة",icon:Gauge},
  {id:"products",label:"المنتجات",icon:Package},
  {id:"designs",label:"قوالب التصميم",icon:FileImage},
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
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({name:"",category:"دروع",price:"حسب الطلب",description:""});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rokn-admin-products"); if (saved) setProducts(JSON.parse(saved));
      setWhatsappNumber(localStorage.getItem("rokn-whatsapp-number") || "");
    } catch {}
  }, []);

  function saveProducts(next: Product[]): boolean {
    try {
      localStorage.setItem("rokn-admin-products", JSON.stringify(next));
      setProducts(next);
      setNotice("تم الحفظ في هذا المتصفح فقط؛ لم تتم مزامنة المنتجات مع قاعدة بيانات.");
      return true;
    } catch {
      setNotice("تعذر حفظ التغييرات في المتصفح. تحقق من مساحة التخزين وإعدادات الخصوصية ثم أعد المحاولة.");
      return false;
    }
  }
  function addProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) { setNotice("يرجى إدخال اسم المنتج."); return; }
    const next = editingId === null
      ? [{...form,id:Date.now(),status:"مسودة" as const},...products]
      : products.map(p => p.id === editingId ? {...p,...form} : p);
    if (saveProducts(next)) {
      setForm({name:"",category:"دروع",price:"حسب الطلب",description:""});
      setEditingId(null);
      setShowForm(false);
    }
  }
  function toggleProductStatus(id: number) {
    saveProducts(products.map(p => p.id === id ? {...p,status:p.status === "منشور" ? "مسودة" : "منشور"} : p));
  }
  async function logout() {
    await fetch("/api/admin/logout", {method:"POST"});
    router.replace("/admin/login");
    router.refresh();
  }
  const filtered = useMemo(() => products.filter(p => (p.name+" "+p.category+" "+p.description).toLowerCase().includes(search.toLowerCase())), [products,search]);
  const current = navItems.find(n=>n.id===active)?.label || "نظرة عامة";

  return <main className="admin-app" dir="rtl">
    <aside className={"admin-sidebar "+(mobileNav?"mobile-open":"")}>
      <div className="admin-brand"><div className="brand-mark">ر</div><div><strong>ركن</strong><span>مساحة إدارة الأعمال</span></div><button className="sidebar-close" onClick={()=>setMobileNav(false)} aria-label="إغلاق القائمة"><X size={18}/></button></div>
      <div className="workspace-chip"><span className="workspace-dot"/><div><b>متجر ركن</b><small>المساحة الرئيسية</small></div><ChevronLeft size={16}/></div>
      <p className="side-label">إدارة المتجر</p>
      <nav className="admin-nav">{navItems.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>{setActive(item.id);setMobileNav(false)}} className={active===item.id?"active":""}><Icon size={18}/><span>{item.label}</span>{item.id==="orders"&&<em>3</em>}</button>})}</nav>
      <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={19}/><b>تحتاج إلى مساعدة؟</b><p>تعرّف على خطوات إدارة متجرك.</p><a href="mailto:info@rokn-art-works.com">تواصل مع الدعم <ArrowDownLeft size={14}/></a></div><button className="logout-button" onClick={logout}><LogOut size={17}/> تسجيل الخروج</button></div>
    </aside>
    {mobileNav&&<button className="nav-scrim" aria-label="إغلاق القائمة" onClick={()=>setMobileNav(false)}/>}
    <section className="admin-main">
      <header className="admin-topbar"><div className="topbar-heading"><button className="mobile-menu" onClick={()=>setMobileNav(true)} aria-label="فتح القائمة"><Menu size={20}/></button><div><div className="breadcrumb">ركن <ChevronLeft size={13}/> لوحة التحكم <ChevronLeft size={13}/> <b>{current}</b></div><h1>{current}</h1></div></div><div className="topbar-actions"><a className="store-link" href="/" target="_blank" rel="noreferrer"><ArrowUpLeft size={16}/> عرض المتجر</a><button className="icon-button" aria-label="الإشعارات" onClick={()=>setNotice("لا توجد إشعارات جديدة.")}><Bell size={18}/><i/></button><div className="admin-avatar">م</div><div className="admin-user"><b>مدير المتجر</b><span>صلاحية المدير</span></div></div></header>
      <div className="admin-content">
        {notice&&<div className="admin-notice"><CheckCircle2 size={16}/>{notice}<button onClick={()=>setNotice("")} aria-label="إغلاق"><X size={15}/></button></div>}
        {active==="overview"&&<><div className="welcome-row"><div><span className="eyebrow">ملخص النشاط</span><h2>أهلًا بك في مساحة عملك 👋</h2><p>تابع المنتجات والتصميمات وأحدث حركة المتجر من مكان واحد.</p></div><button className="btn primary" onClick={()=>{setActive("products");setShowForm(true)}}><Plus size={17}/> إضافة منتج</button></div>
          <div className="stats-grid"><Stat icon={ShoppingBag} label="إجمالي الطلبات" value="—" hint="ستظهر عند ربط الطلبات بالخادم" tone="violet"/><Stat icon={Package} label="المنتجات" value={String(products.length)} hint="عناصر في هذه القائمة" tone="blue"/><Stat icon={Users} label="العملاء" value="—" hint="بانتظار قاعدة بيانات العملاء" tone="amber"/><Stat icon={CreditCard} label="المبيعات" value="—" hint="لا توجد بوابة دفع مربوطة" tone="green"/></div>
          <div className="dashboard-grid"><section className="panel recent-panel"><div className="panel-head"><div><h3>المنتجات الأخيرة</h3><p>إدارة سريعة للكتالوج</p></div><button className="text-action" onClick={()=>setActive("products")}>عرض الكل <ChevronLeft size={15}/></button></div><ProductTable products={products.slice(0,4)} onEdit={()=>{setActive("products");setNotice("يمكنك متابعة إدارة المنتجات من قائمة المنتجات.")}}/></section><section className="panel quick-panel"><div className="panel-head"><div><h3>اختصارات سريعة</h3><p>أنجز المهام المتكررة</p></div><Sparkles size={18}/></div><QuickAction icon={Plus} title="إضافة منتج جديد" desc="أضف منتجًا إلى كتالوج المتجر" onClick={()=>{setActive("products");setShowForm(true)}}/><QuickAction icon={FileImage} title="قوالب التصميم" desc="انتقل إلى محرر النماذج" onClick={()=>setActive("designs")}/><QuickAction icon={FolderKanban} title="متابعة الطلبات" desc="عرض مساحة الطلبات" onClick={()=>setActive("orders")}/></section></div>
          <div className="setup-banner"><div className="setup-icon"><Activity size={22}/></div><div><b>خطوة مهمة قبل استقبال الطلبات الفعلية</b><p>القائمة الحالية للمنتجات تحفظ داخل المتصفح. لتشغيل المتجر تجاريًا نحتاج قاعدة بيانات دائمة وربط الطلبات وعروض الأسعار بها.</p></div><span className="status-pill">إعداد مطلوب</span></div>
        </>}
        {active==="products"&&<><div className="section-intro"><div><h2>كتالوج المنتجات</h2><p>نظّم منتجاتك وخدماتك الفنية، وأضف وصفًا واضحًا لكل منتج.</p></div><button className="btn primary" onClick={()=>setShowForm(!showForm)}><Plus size={17}/> إضافة منتج</button></div>
          {showForm&&<form className="panel product-form" onSubmit={addProduct}><div className="panel-head"><h3>{editingId === null ? "بيانات المنتج الجديد" : "تعديل بيانات المنتج"}</h3><button type="button" className="icon-button" onClick={()=>{setShowForm(false);setEditingId(null)}} aria-label="إغلاق"><X size={17}/></button></div><label>اسم المنتج<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="مثال: درع تكريمي فاخر"/></label><div className="form-row"><label>التصنيف<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{["دروع","ميداليات","لوحات","هدايا","ديكور","طباعة ثلاثية الأبعاد","أعمال خشبية","أخرى"].map(c=><option key={c}>{c}</option>)}</select></label><label>السعر أو آلية التسعير<input value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="حسب الطلب"/></label></div><label>وصف المنتج<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} placeholder="الخامات، الاستخدام، خيارات التخصيص..."/></label><div className="form-actions"><button className="btn primary" type="submit">حفظ المنتج</button><button className="btn secondary" type="button" onClick={()=>{setShowForm(false);setEditingId(null)}}>إلغاء</button></div></form>}
          <section className="panel"><div className="table-toolbar"><div className="search-field"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن منتج..."/></div><span>{filtered.length} منتجات</span></div><ProductTable products={filtered} onEdit={(id)=>{const p=products.find(x=>x.id===id);if(p){setEditingId(id);setForm({name:p.name,category:p.category,price:p.price,description:p.description});setShowForm(true);setNotice("يمكنك تعديل البيانات ثم حفظها؛ لن يُحذف المنتج إذا ألغيت التعديل.")}}} onTogglePublish={toggleProductStatus} onDelete={(id)=>{if(confirm("هل تريد حذف هذا المنتج من هذه القائمة؟"))saveProducts(products.filter(p=>p.id!==id))}}/></section>
        </>}
        {active==="settings"&&<section className="panel product-form"><div className="panel-head"><h3>إعدادات استقبال الطلبات</h3></div><p>أدخل رقم واتساب الذي تريد استقبال طلبات التصميم والحجز عليه، مع مفتاح الدولة، دون علامة + أو مسافات. مثال: 2189XXXXXXXX.</p><label>رقم واتساب الاستقبال<input dir="ltr" inputMode="tel" value={whatsappNumber} onChange={e=>setWhatsappNumber(e.target.value)} placeholder="2189XXXXXXXX"/></label><div className="form-actions"><button className="btn primary" onClick={()=>{const normalized=whatsappNumber.replace(/\D/g,"");if(normalized.length<8){setNotice("أدخل رقم واتساب صحيحًا مع مفتاح الدولة.");return;}try{localStorage.setItem("rokn-whatsapp-number",normalized);setWhatsappNumber(normalized);setNotice("تم حفظ رقم واتساب في هذا المتصفح فقط. يلزم ربطه بالخادم ليصبح إعدادًا دائمًا.");}catch{setNotice("تعذر حفظ الرقم في هذا المتصفح.");}}}>حفظ رقم واتساب</button></div><p className="editor-help">مهم: هذه الإعدادات محفوظة في المتصفح الحالي فقط وليست مشتركة بين أجهزة الإدارة والعملاء بعد.</p></section>}{active!=="overview"&&active!=="products"&&active!=="settings"&&<section className="panel empty-module"><div className="empty-icon"><LayoutGrid size={25}/></div><h2>{current}</h2><p>{active==="designs"?"ستكون هنا إدارة قوالب الدروع والميداليات واللوحات وعناصر محرر العميل.":active==="orders"?"ستظهر الطلبات وحالات التنفيذ ومواعيد التسليم بعد ربط قاعدة بيانات الطلبات.":active==="customers"?"سيُعرض ملف كل عميل وسجل طلباته عند تفعيل تخزين بيانات العملاء.":active==="quotes"?"تجهيز عروض الأسعار وربطها بأرقام الطلبات والفواتير.":"تنظيم استفسارات العملاء ومتابعة الردود."}</p><span className="status-pill">قسم جاهز للتطوير</span><div className="empty-module-actions"><button className="btn primary" onClick={()=>setActive("products")}>العودة إلى المنتجات</button><a className="btn secondary" href="mailto:info@rokn-art-works.com">التواصل مع فريق التطوير</a></div></section>}
        <footer className="admin-footer">© {new Date().getFullYear()} ركن للأعمال الفنية <span>لوحة الإدارة · نسخة أولية</span></footer>
      </div>
    </section>
  </main>;
}

function Stat({icon:Icon,label,value,hint,tone}:{icon:typeof Package;label:string;value:string;hint:string;tone:string}){return <article className="stat-card"><div className={"stat-icon "+tone}><Icon size={19}/></div><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>}
function QuickAction({icon:Icon,title,desc,onClick}:{icon:typeof Package;title:string;desc:string;onClick:()=>void}){return <button className="quick-action" onClick={onClick}><span><Icon size={18}/></span><div><b>{title}</b><small>{desc}</small></div><ChevronLeft size={16}/></button>}
function ProductTable({products,onEdit,onDelete,onTogglePublish}:{products:Product[];onEdit:(id:number)=>void;onDelete?:(id:number)=>void;onTogglePublish?:(id:number)=>void}){return <div className="table-wrap"><table className="products-table"><thead><tr><th>المنتج</th><th>التصنيف</th><th>السعر</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><div className="product-cell"><div className="product-thumb"><Box size={19}/></div><div><b>{p.name}</b><small>{p.description||"بدون وصف"}</small></div></div></td><td>{p.category}</td><td>{p.price}</td><td><span className={"product-status "+(p.status==="منشور"?"published":"draft")}>{p.status}</span></td><td><div className="row-actions"><button onClick={()=>onEdit(p.id)}>تعديل</button>{onTogglePublish&&<button onClick={()=>onTogglePublish(p.id)}>{p.status==="منشور"?"إرجاع لمسودة":"نشر"}</button>}{onDelete&&<button className="delete-action" onClick={()=>onDelete(p.id)}>حذف</button>}</div></td></tr>)}</tbody></table>{products.length===0&&<div className="table-empty">لا توجد منتجات مطابقة لبحثك.</div>}</div>}
