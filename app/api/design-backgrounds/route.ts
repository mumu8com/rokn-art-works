import { NextResponse } from "next/server";
import { Pool } from "pg";
import { isAdminSessionValid } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const globalForPool = globalThis as typeof globalThis & { roknBackgroundPool?: Pool };
function pool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_MISSING");
  if (!globalForPool.roknBackgroundPool) globalForPool.roknBackgroundPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    max: 3,
  });
  return globalForPool.roknBackgroundPool;
}
let schemaReady: Promise<void> | null = null;
async function ensureTable() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool().query(`CREATE TABLE IF NOT EXISTS design_backgrounds (
          id TEXT PRIMARY KEY, template_id TEXT NOT NULL, title TEXT NOT NULL DEFAULT '',
          image TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
        await pool().query("ALTER TABLE design_backgrounds ADD COLUMN IF NOT EXISTS asset_type TEXT NOT NULL DEFAULT 'background'");
    })().catch((error) => { schemaReady = null; throw error; });
  }
  await schemaReady;
}export async function GET(request: Request) {
  try {
    await ensureTable();
    const params = new URL(request.url).searchParams;
    const templateId = params.get("templateId");
    const assetType = params.get("type") === "base" ? "base" : "background";
    if (!templateId) return NextResponse.json({ error: "معرّف القالب مطلوب." }, { status: 400 });
    const result = await pool().query(
      'SELECT id,template_id AS "templateId",title,image,asset_type AS "assetType",created_at AS "createdAt" FROM design_backgrounds WHERE template_id=$1 AND asset_type=$2 ORDER BY created_at DESC',
      [templateId.slice(0,100), assetType]
    );
    return NextResponse.json({ backgrounds: result.rows });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return NextResponse.json({ error: "قاعدة البيانات غير متصلة." }, { status: 503 });
    console.error("design_backgrounds_get_failed", error);
    return NextResponse.json({ error: "تعذر تحميل صور الخلفية المحفوظة." }, { status: 503 });
  }
}
export async function POST(request: Request) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: "إضافة صور الخلفية متاحة للمدير بعد تسجيل الدخول." }, { status: 401 });
  try {
    const body = await request.json() as { templateId?: unknown; title?: unknown; image?: unknown; type?: unknown };
    const templateId = typeof body.templateId === "string" ? body.templateId.trim().slice(0,100) : "";
    const title = typeof body.title === "string" ? body.title.trim().slice(0,120) : "";
    const image = typeof body.image === "string" ? body.image : "";
    const assetType = body.type === "base" ? "base" : "background";
    if (!templateId || !image) return NextResponse.json({ error: "القالب والصورة مطلوبان." }, { status: 400 });
    if (image.length > 8_000_000) return NextResponse.json({ error: "الصورة كبيرة جدًا؛ اختر صورة أقل من 5 ميغابايت." }, { status: 413 });
    if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(image)) return NextResponse.json({ error: "صيغة الصورة غير مدعومة. استخدم PNG أو JPG أو WEBP أو GIF." }, { status: 400 });
    await ensureTable();
    const id = crypto.randomUUID();
    const result = await pool().query(
      'INSERT INTO design_backgrounds (id,template_id,title,image,asset_type) VALUES ($1,$2,$3,$4,$5) RETURNING id,template_id AS "templateId",title,image,asset_type AS "assetType",created_at AS "createdAt"',
      [id,templateId,title || (assetType === "base" ? "الشكل" : "خلفية جديدة"),image,assetType]
    );
    return NextResponse.json({ background: result.rows[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return NextResponse.json({ error: "قاعدة البيانات غير متصلة." }, { status: 503 });
    console.error("design_backgrounds_save_failed", error);
    return NextResponse.json({ error: "تعذر حفظ صورة الخلفية." }, { status: 503 });
  }
}
export async function DELETE(request: Request) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: "يلزم تسجيل دخول المدير." }, { status: 401 });
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "معرّف الصورة مطلوب." }, { status: 400 });
    await ensureTable();
    await pool().query("DELETE FROM design_backgrounds WHERE id=$1", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return NextResponse.json({ error: "قاعدة البيانات غير متصلة." }, { status: 503 });
    console.error("design_background_delete_failed", error);
    return NextResponse.json({ error: "تعذر حذف صورة الخلفية." }, { status: 503 });
  }
}
