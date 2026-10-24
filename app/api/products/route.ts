import { NextResponse } from "next/server";
import { isAdminSessionValid } from "@/lib/admin-auth";
import { ensureStoreSchema, storePool } from "@/lib/store-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dbUnavailable() {
  return NextResponse.json({ error: "قاعدة بيانات المنتجات غير متاحة. تحقق من إعداد DATABASE_URL في Render." }, { status: 503 });
}

export async function GET() {
  try {
    await ensureStoreSchema();
    const admin = await isAdminSessionValid();
    const result = await storePool().query(
      admin
        ? 'SELECT id, name, category, price, status, description, updated_at AS "updatedAt" FROM store_products ORDER BY updated_at DESC'
        : 'SELECT id, name, category, price, status, description FROM store_products WHERE status = $1 ORDER BY updated_at DESC',
      admin ? [] : ["منشور"]
    );
    return NextResponse.json({ products: result.rows.map(row => ({ ...row, id: Number(row.id) })) });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return dbUnavailable();
    console.error("store_products_get_failed", error);
    return NextResponse.json({ error: "تعذر تحميل المنتجات." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: "يلزم تسجيل دخول المدير." }, { status: 401 });
  try {
    await ensureStoreSchema();
    const body = await request.json() as { products?: unknown[] } & Record<string, unknown>;
    const items = Array.isArray(body.products) ? body.products : [body];
    if (items.length > 250) return NextResponse.json({ error: "عدد المنتجات المرسل كبير جدًا." }, { status: 413 });
    const db = storePool();
    const saved: Array<{id:number;name:string;category:string;price:string;status:string;description:string;updatedAt?:string}> = [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const p = item as Record<string, unknown>;
      const name = typeof p.name === "string" ? p.name.trim().slice(0, 180) : "";
      if (!name) continue;
      const rawId = Number(p.id);
      const id = Number.isSafeInteger(rawId) && rawId > 0 ? rawId : Date.now() + saved.length;
      const category = typeof p.category === "string" ? p.category.trim().slice(0, 80) || "أخرى" : "أخرى";
      const price = typeof p.price === "string" ? p.price.trim().slice(0, 100) || "حسب الطلب" : "حسب الطلب";
      const status = p.status === "منشور" ? "منشور" : "مسودة";
      const description = typeof p.description === "string" ? p.description.trim().slice(0, 2000) : "";
      const result = await db.query(
        `INSERT INTO store_products (id,name,category,price,status,description,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW())
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category,price=EXCLUDED.price,status=EXCLUDED.status,description=EXCLUDED.description,updated_at=NOW()
         RETURNING id,name,category,price,status,description,updated_at AS "updatedAt"`,
        [id,name,category,price,status,description]
      );
      saved.push({ ...result.rows[0], id: Number(result.rows[0].id) });
    }
    return NextResponse.json({ products: saved });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return dbUnavailable();
    console.error("store_products_post_failed", error);
    return NextResponse.json({ error: "تعذر حفظ المنتجات في قاعدة البيانات." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: "يلزم تسجيل دخول المدير." }, { status: 401 });
  try {
    await ensureStoreSchema();
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "رقم المنتج غير صالح." }, { status: 400 });
    await storePool().query("DELETE FROM store_products WHERE id = $1", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return dbUnavailable();
    console.error("store_products_delete_failed", error);
    return NextResponse.json({ error: "تعذر حذف المنتج." }, { status: 503 });
  }
}
