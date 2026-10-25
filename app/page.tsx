"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Award, Box, Check, ChevronLeft, Layers3, PenTool, ShieldCheck, Sparkles } from "lucide-react";

type Product = { id?: string; name: string; category: string; kind?: string; tone?: string; description: string; image?: string };

const products: Product[] = [
  {name:"درع تكريمي فاخر",category:"الدروع",kind:"shield",tone:"",description:"تصميم أنيق لتكريم الإنجازات والشخصيات والمؤسسات."},
  {name:"ميدالية تذكارية",category:"الهدايا التذكارية",kind:"medal",tone:"navy",description:"تفاصيل خاصة بمناسبتك، من الاسم إلى الألوان والعبارة."},
  {name:"لوحة مؤسسية",category:"اللوحات",kind:"board",tone:"wood",description:"لوحات تعريفية وتذكارية مصممة بهوية الجهة."},
];
const services = [
  {icon:Award,title:"دروع وميداليات",desc:"حلول تكريمية للبطولات والفعاليات والمناسبات الرسمية."},
  {icon:Layers3,title:"أعمال خشبية وديكور",desc:"أفكار عملية للمساحات والأثاث والقطع المصممة حسب الطلب."},
  {icon:Box,title:"مجسمات وطباعة ثلاثية الأبعاد",desc:"تحويل الفكرة إلى نموذج أو مجسم بتفاصيل تناسب المشروع."},
  {icon:PenTool,title:"تصميم وتنفيذ خاص",desc:"نبدأ من فكرتك ونساعدك على اختيار الشكل والخامة والتشطيب."},
];

export default function Home() {
  const [visibleProducts, setVisibleProducts] = useState<Product[]>(products);
  useEffect(() => {
    let live = true;
    fetch("/api/design-templates").then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      if (!live || !Array.isArray(data.templates) || data.templates.length === 0) return;
      setVisibleProducts(data.templates.map((item: { id: string; title?: string; name?: string; category?: string; description?: string; image?: string }) => ({
        id: item.id, name: item.title || item.name || "منتج مخصص", category: item.category || "منتجات مخصصة",
        description: item.description || "تصميم حسب الطلب من ركن للأعمال الفنية.", image: item.image || "",
      })));
    }).catch(() => {});
    return () => { live = false; };
  }, []);

  return <main className="wrap home-premium">
    <header className="nav premium-nav"><Link className="brand" href="/"><span className="brand-mark">ر</span><span>ركن <small>للأعمال الفنية</small></span></Link><nav className="links"><Link href="/products">المنتجات</Link><a href="#services">خدماتنا</a><a href="#process">رحلة العمل</a><Link href="/design">استوديو التصميم</Link><Link className="nav-cta" href="/request">اطلب تصميمك <ArrowUpLeft size={15}/></Link></nav></header>
    <section className="hero premium-hero"><div className="hero-copy"><div className="eyebrow"><Sparkles size={15} style={{display:"inline",verticalAlign:"middle",marginLeft:7}}/> فنّ يُصنع خصيصًا لك</div><h1>نحوّل أفكارك إلى<br/><span>قطعٍ لها معنى.</span></h1><p>دروع تكريمية، هدايا تذكارية، لوحات، ومشاريع فنية مخصصة — نصممها بعناية وننفذها لتصبح جزءًا من قصتك.</p><div className="hero-actions"><Link className="btn primary" href="/design">ابدأ تصميمك <ArrowLeft size={17}/></Link><Link className="btn secondary" href="/products">اكتشف المنتجات <ChevronLeft size={17}/></Link><Link className="btn text-action" href="/request">لديك فكرة خاصة؟ اطلب عرض سعر <ArrowUpLeft size={16}/></Link></div><div className="hero-proof"><span><Check size={15}/> تصميم حسب الطلب</span><i/><span><Check size={15}/> خامات وتشطيبات متنوعة</span><i/><span><Check size={15}/> مراجعة التفاصيل قبل التنفيذ</span></div></div><div className="hero-artwork" aria-hidden="true"><div className="art-grid"/><div className="art-ring ring-one"/><div className="art-ring ring-two"/><div className="art-monogram">ر<span>ROKN</span></div><div className="art-label label-top">MADE WITH MEANING</div><div className="art-label label-bottom">الفكرة منك · والحرفة علينا</div><div className="art-stamp">فن<br/>بصمتك</div></div></section>
    <section id="products" className="section"><div className="section-heading"><div><div className="eyebrow">مختارة بعناية</div><h2>قطع فنية تبدأ من فكرتك</h2><p>استكشف المنتجات، افتح صفحة المنتج، ثم انتقل إلى تخصيص التصميم أو طلب عرض سعر.</p></div><Link className="card-link" href="/products">عرض كل المنتجات <ArrowLeft size={15}/></Link></div><div className="category-rail">{[...new Set(visibleProducts.map(p=>p.category))].map(category=><Link key={category} href={"/categories/"+encodeURIComponent(category)} className="category-pill"><span>{category}</span><ArrowLeft size={14}/></Link>)}</div>
      <div className="product-grid">{visibleProducts.map((p)=><article className="showcase-card" key={p.id||p.name}>
        {p.image ? <div className="product-art product-art-image"><img className="product-main-image" src={p.image} alt={p.name}/></div> : <div className={"product-art "+(p.tone||"")}>{p.kind==="shield"?<div className="mini-plaque"><span>شكر<br/>وتقدير</span></div>:p.kind==="medal"?<div className="mini-medal"><span>ركن<br/>للتميز</span></div>:<div className="mini-board"><div><strong>لوحة تذكارية</strong><br/><small>تصميم مخصص للمؤسسات</small></div></div>}</div>}
        <div className="card-body"><div className="card-meta"><span className="category-chip">{p.category}</span><span>يصنع حسب الطلب</span></div><h3>{p.name}</h3><p>{p.description}</p><div className="card-bottom"><span className="price-note">السعر حسب المواصفات</span><Link href={"/products/"+encodeURIComponent(p.id||p.name.trim().replace(/\s+/g,"-"))} className="card-link">تفاصيل المنتج <ArrowLeft size={14}/></Link></div></div>
      </article>)}</div>
    </section>
    <section id="services" className="section premium-services"><div className="section-heading"><div><div className="eyebrow">ماذا نصنع؟</div><h2>خدمات فنية تتسع لأفكارك</h2><p>من القطع التكريمية إلى المشاريع الفنية والهندسية المخصصة.</p></div></div><div className="services-grid">{services.map(s=>{const Icon=s.icon;return <article className="service-card" key={s.title}><div className="service-icon"><Icon size={21}/></div><h3>{s.title}</h3><p>{s.desc}</p></article>})}</div></section>
    <section id="process" className="section premium-process"><div className="section-heading"><div><div className="eyebrow">خطوات بسيطة</div><h2>من فكرتك إلى طلب واضح</h2></div></div><div className="services-grid">{[{n:"01",title:"اختر المنتج",desc:"ابدأ من نوع المنتج أو النموذج الأقرب لفكرتك."},{n:"02",title:"خصّص التصميم",desc:"عدّل النصوص والألوان والمقاس، وراجع المعاينة."},{n:"03",title:"أرسل التفاصيل",desc:"جهّز وصفك والملاحظات المطلوبة للحصول على عرض سعر."},{n:"04",title:"اعتماد وتنفيذ",desc:"تُراجع المواصفات والخامات والسعر قبل بدء التصنيع."}].map(s=><article className="service-card" key={s.n}><div className="eyebrow">{s.n}</div><h3 style={{marginTop:12}}>{s.title}</h3><p>{s.desc}</p></article>)}</div></section>
    <section className="cta-panel premium-cta"><div><div className="eyebrow" style={{color:"#e1c17f"}}>هل لديك فكرة مختلفة؟</div><h2>لنبدأ تصميمها معًا</h2><p>أنشئ معاينة أولية لمنتجك، ثم جهّز تفاصيل الطلب لمناقشة التنفيذ والتكلفة.</p></div><Link href="/request" className="btn">اطلب منتجًا أو عرض سعر <ArrowUpLeft size={17}/></Link></section>
    <footer className="footer"><span>© {new Date().getFullYear()} ركن للأعمال الفنية. جميع الحقوق محفوظة.</span><span>أعمال فنية وهندسية حسب الطلب <ShieldCheck size={13} style={{display:"inline",verticalAlign:"middle"}}/></span></footer>
  </main>;
}
