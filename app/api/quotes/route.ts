import { NextResponse } from "next/server";
import { isAdminSessionValid } from "@/lib/admin-auth";
import { ensureStoreSchema, storePool } from "@/lib/store-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: "يلزم تسجيل دخول المدير." }, { status: 401 });
  try {
    await ensureStoreSchema();
    const result = await storePool().query('SELECT id, customer_name AS "customerName", phone, email, product_id AS "productId", product_name AS "productName", quantity, details, estimated_price AS "estimatedPrice", status, created_at AS "createdAt" FROM store_quotes ORDER BY created_at DESC LIMIT 500');
    return NextResponse.json({ quotes: result.rows.map(r => ({ ...r, productId: r.productId === null ? null : Number(r.productId) })) });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return NextResponse.json({ error: "قاعدة البيانات غير مربوطة." }, { status: 503 });
    console.error("store_quotes_get_failed", error);
    return NextResponse.json({ error: "تعذر تحميل عروض الأسعار." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة." }, { status: 400 });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة." }, { status: 400 });
  }
  const body = parsed as Record<string, unknown>;
  try {
    await ensureStoreSchema();
    const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0,120) : "";
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0,40) : "";
    const email = typeof body.email === "string" ? body.email.trim().slice(0,160) : "";
    const productId = Number(body.productId);
    const quantity = body.quantity === undefined ? 1 : Number(body.quantity);
    const details = typeof body.details === "string" ? body.details.trim().slice(0,4000) : "";
    if (!customerName || !phone || phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 20 || !Number.isSafeInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "الاسم ورقم الهاتف الصحيح والمنتج مطلوبة." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "صيغة البريد الإلكتروني غير صحيحة." }, { status: 400 });
    }
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) {
      return NextResponse.json({ error: "يجب أن تكون الكمية عددًا صحيحًا بين 1 و1000." }, { status: 400 });
    }
    const db = storePool();
    const product = await db.query("SELECT id,name FROM store_products WHERE id=$1 AND status='منشور'", [productId]);
    if (!product.rowCount) return NextResponse.json({ error: "المنتج غير متاح حاليًا." }, { status: 404 });
    const id = crypto.randomUUID();
    await db.query("INSERT INTO store_quotes (id,customer_name,phone,email,product_id,product_name,quantity,details) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [id,customerName,phone,email||"",productId,product.rows[0].name,quantity,details]);
    return NextResponse.json({ ok: true, quoteId: id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return NextResponse.json({ error: "طلب عرض السعر غير متاح حاليًا لعدم اكتمال إعداد قاعدة البيانات." }, { status: 503 });
    console.error("store_quotes_post_failed", error);
    return NextResponse.json({ error: "تعذر إرسال طلب عرض السعر. حاول لاحقًا." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: "يلزم تسجيل دخول المدير." }, { status: 401 });
  try {
    await ensureStoreSchema();
    const body = await request.json() as { id?: string; status?: string; estimatedPrice?: string };
    const allowed = ["بانتظار التسعير","تم إرسال العرض","مقبول","مرفوض","ملغي"];
    if (!body.id || !body.status || !allowed.includes(body.status)) return NextResponse.json({ error: "حالة عرض السعر غير صالحة." }, { status: 400 });
    const price = typeof body.estimatedPrice === "string" ? body.estimatedPrice.trim().slice(0,100) : "";
    const result = await storePool().query('UPDATE store_quotes SET status=$2,estimated_price=$3,updated_at=NOW() WHERE id=$1 RETURNING id', [body.id,body.status,price]);
    if (!result.rowCount) return NextResponse.json({ error: "عرض السعر غير موجود." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("store_quotes_patch_failed", error);
    return NextResponse.json({ error: "تعذر تحديث عرض السعر." }, { status: 503 });
  }
}
