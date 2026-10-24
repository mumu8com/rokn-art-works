import { NextResponse } from "next/server";
import { isAdminSessionValid } from "@/lib/admin-auth";
import { ensureStoreSchema, storePool } from "@/lib/store-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: "يلزم تسجيل دخول المدير." }, { status: 401 });
  try {
    await ensureStoreSchema();
    const result = await storePool().query('SELECT id, customer_name AS "customerName", phone, email, product_id AS "productId", product_name AS "productName", quantity, details, status, created_at AS "createdAt" FROM store_orders ORDER BY created_at DESC LIMIT 500');
    return NextResponse.json({ orders: result.rows.map(r => ({ ...r, productId: r.productId === null ? null : Number(r.productId) })) });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return NextResponse.json({ error: "قاعدة البيانات غير مربوطة." }, { status: 503 });
    console.error("store_orders_get_failed", error);
    return NextResponse.json({ error: "تعذر تحميل الطلبات." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureStoreSchema();
    const body = await request.json() as Record<string, unknown>;
    const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0,120) : "";
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0,40) : "";
    const email = typeof body.email === "string" ? body.email.trim().slice(0,160) : "";
    const productId = Number(body.productId);
    const quantity = Number.isSafeInteger(Number(body.quantity)) ? Math.max(1, Math.min(1000, Number(body.quantity))) : 1;
    const details = typeof body.details === "string" ? body.details.trim().slice(0,4000) : "";
    if (!customerName || !phone || !Number.isSafeInteger(productId) || productId <= 0) return NextResponse.json({ error: "الاسم ورقم الهاتف والمنتج مطلوبة." }, { status: 400 });
    const db = storePool();
    const product = await db.query("SELECT id,name FROM store_products WHERE id=$1 AND status='منشور'", [productId]);
    if (!product.rowCount) return NextResponse.json({ error: "المنتج غير متاح حاليًا." }, { status: 404 });
    const id = crypto.randomUUID();
    await db.query("INSERT INTO store_orders (id,customer_name,phone,email,product_id,product_name,quantity,details) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [id,customerName,phone,email||"",productId,product.rows[0].name,quantity,details]);
    return NextResponse.json({ ok: true, orderId: id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return NextResponse.json({ error: "استقبال الطلبات غير متاح حاليًا لعدم اكتمال إعداد قاعدة البيانات." }, { status: 503 });
    console.error("store_orders_post_failed", error);
    return NextResponse.json({ error: "تعذر تسجيل الطلب. حاول لاحقًا." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: "يلزم تسجيل دخول المدير." }, { status: 401 });
  try {
    await ensureStoreSchema();
    const body = await request.json() as { id?: string; status?: string };
    const allowed = ["جديد","قيد المراجعة","قيد التنفيذ","مكتمل","ملغي"];
    if (!body.id || !body.status || !allowed.includes(body.status)) return NextResponse.json({ error: "حالة الطلب غير صالحة." }, { status: 400 });
    const result = await storePool().query('UPDATE store_orders SET status=$2,updated_at=NOW() WHERE id=$1 RETURNING id', [body.id,body.status]);
    if (!result.rowCount) return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("store_orders_patch_failed", error);
    return NextResponse.json({ error: "تعذر تحديث الطلب." }, { status: 503 });
  }
}
