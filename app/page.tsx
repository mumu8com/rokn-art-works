import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Award, Box, Check, ChevronLeft, DraftingCompass, Gift, Layers3, Palette, PenTool, ShieldCheck, Sparkles, Wrench } from "lucide-react";

const products = [
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
  return <main className="wrap">
    <header className="nav"><Link className="brand" href="/"><span className="brand-mark">ر</span> ركن للأعمال الفنية</Link><nav className="links"><a href="#products">المنتجات</a><a href="#services">خدماتنا</a><a href="#process">كيف نعمل؟</a><Link href="/design">استوديو التصميم</Link><Link href="/admin/login">دخول المدير</Link></nav></header>
    <section className="hero"><div><div className="eyebrow"><Sparkles size={14} style={{display:"inline",verticalAlign:"middle",marginLeft:5}}/> من الفكرة إلى قطعة تستحق الاحتفاظ بها</div><h1>أفكارك تستحق أن تتحول إلى <span style={{color:"#a47e43"}}>عمل فني</span></h1><p>نصمم وننفّذ الدروع والهدايا التذكارية واللوحات والأعمال الفنية والهندسية حسب طلبك. اختر نموذجًا، شاركنا تفاصيلك، ودعنا نساعدك في تحويل فكرتك إلى واقع.</p><div className="hero-actions"><Link className="btn primary" href="/design">ابدأ تصميم منتجك <ArrowLeft size={17}/></Link><a className="btn secondary" href="#products">استكشف المنتجات <ChevronLeft size={17}/></a></div><div style={{display:"flex",gap:18,flexWrap:"wrap",marginTop:24,color:"#68798a",fontSize:12}}><span><Check size={14} style={{display:"inline",verticalAlign:"middle",color:"#4b8c69",marginLeft:5}}/> تصميم حسب الطلب</span><span><Check size={14} style={{display:"inline",verticalAlign:"middle",color:"#4b8c69",marginLeft:5}}/> خيارات متعددة للخامات</span><span><Check size={14} style={{display:"inline",verticalAlign:"middle",color:"#4b8c69",marginLeft:5}}/> متابعة مباشرة للتفاصيل</span></div></div>
      <div className="hero-visual"><div className="visual-orb"/><div className="hero-plaque"><div className="plaque-inner"><span>ROKN · CUSTOM MADE</span><strong>شكرًا<br/>وتقديرًا</strong><i/><span>صناعة تليق بإنجازك</span></div></div><div className="visual-caption"><span/> تصاميم تنطلق من فكرتك</div></div>
    </section>
    <section id="products" className="section"><div className="section-heading"><div><div className="eyebrow">منتجات مختارة</div><h2>ابدأ من نموذج، واصنعه بطريقتك</h2><p>اختر الفئة التي تناسب مناسبتك، ثم انتقل إلى مساحة التصميم لتجربة فكرتك.</p></div><Link className="card-link" href="/design">فتح استوديو التصميم <ArrowLeft size={15}/></Link></div>
      <div className="product-grid">{products.map((p)=><article className="showcase-card" key={p.name}><div className={"product-art "+p.tone}>{p.kind==="shield"?<div className="mini-plaque"><span>شكر<br/>وتقدير</span></div>:p.kind==="medal"?<div className="mini-medal"><span>ركن<br/>للتميز</span></div>:<div className="mini-board"><div><strong>لوحة تذكارية</strong><br/><small>تصميم مخصص للمؤسسات</small></div></div>}</div><div className="card-body"><div className="card-meta"><span className="category-chip">{p.category}</span><span>يصنع حسب الطلب</span></div><h3>{p.name}</h3><p>{p.description}</p><div className="card-bottom"><span className="price-note">السعر حسب المواصفات</span><Link href="/design" className="card-link">خصّص المنتج <ArrowLeft size={14}/></Link></div></div></article>)}</div>
    </section>
    <section id="services" className="section"><div className="section-heading"><div><div className="eyebrow">ماذا نصنع؟</div><h2>خدمات فنية تتسع لأفكارك</h2><p>من القطع التكريمية إلى المشاريع الفنية والهندسية المخصصة.</p></div></div><div className="services-grid">{services.map(s=>{const Icon=s.icon;return <article className="service-card" key={s.title}><div className="service-icon"><Icon size={21}/></div><h3>{s.title}</h3><p>{s.desc}</p></article>})}</div></section>
    <section id="process" className="section"><div className="section-heading"><div><div className="eyebrow">خطوات بسيطة</div><h2>من فكرتك إلى طلب واضح</h2></div></div><div className="services-grid">{[{n:"01",title:"اختر المنتج",desc:"ابدأ من نوع المنتج أو النموذج الأقرب لفكرتك."},{n:"02",title:"خصّص التصميم",desc:"عدّل النصوص والألوان والمقاس، وراجع المعاينة."},{n:"03",title:"أرسل التفاصيل",desc:"جهّز وصفك والملاحظات المطلوبة للحصول على عرض سعر."},{n:"04",title:"اعتماد وتنفيذ",desc:"تُراجع المواصفات والخامات والسعر قبل بدء التصنيع."}].map(s=><article className="service-card" key={s.n}><div className="eyebrow">{s.n}</div><h3 style={{marginTop:12}}>{s.title}</h3><p>{s.desc}</p></article>)}</div></section>
    <section className="cta-panel"><div><div className="eyebrow" style={{color:"#e1c17f"}}>هل لديك فكرة مختلفة؟</div><h2>لنبدأ تصميمها معًا</h2><p>أنشئ معاينة أولية لمنتجك، ثم جهّز تفاصيل الطلب لمناقشة التنفيذ والتكلفة.</p></div><Link href="/design" className="btn">افتح استوديو التصميم <ArrowUpLeft size={17}/></Link></section>
    <footer className="footer"><span>© {new Date().getFullYear()} ركن للأعمال الفنية. جميع الحقوق محفوظة.</span><span>أعمال فنية وهندسية حسب الطلب <ShieldCheck size={13} style={{display:"inline",verticalAlign:"middle"}}/></span></footer>
  </main>;
}
