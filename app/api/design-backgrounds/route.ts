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
        await pool().query("ALTER TABLE design_backgrounds ADD COLUMN IF NOT EXISTS placement_x INTEGER");
        await pool().query("ALTER TABLE design_backgrounds ADD COLUMN IF NOT EXISTS placement_y INTEGER");
        await pool().query("ALTER TABLE design_backgrounds ADD COLUMN IF NOT EXISTS placement_width INTEGER");
        await pool().query("ALTER TABLE design_backgrounds ADD COLUMN IF NOT EXISTS placement_height INTEGER");
    })().catch((error) => { schemaReady = null; throw error; });
  }
  await schemaReady;
}
export async function GET(request: Request) {
  try {
    await ensureTable();
    const params = new URL(request.url).searchParams;
    const templateId = params.get("templateId");
    const assetType = params.get("type") === "base" ? "base" : "background";
    if (!templateId) return NextResponse.json({ error: "معرّف القالب مطلوب." }, { status: 400 });
    const result = await pool().query(
      `SELECT b.id, b.template_id AS "templateId", b.title, b.image, b.asset_type AS "assetType", COALESCE(b.placement_x, CASE WHEN b.asset_type='base' THEN 15 ELSE 0 END) AS "placementX", COALESCE(b.placement_y, CASE WHEN b.asset_type='base' THEN 20 ELSE 0 END) AS "placementY", COALESCE(b.placement_width, CASE WHEN b.asset_type='base' THEN 70 ELSE 100 END) AS "placementWidth", COALESCE(b.placement_height, CASE WHEN b.asset_type='base' THEN 60 ELSE 100 END) AS "placementHeight", b.created_at AS "createdAt" FROM design_backgrounds b WHERE b.template_id=$1 AND b.asset_type=$2 AND ($3::boolean OR EXISTS (SELECT 1 FROM design_templates t WHERE t.id=b.template_id AND t.published=TRUE)) ORDER BY b.created_at DESC`,
      [templateId.slice(0,100), assetType, await isAdminSessionValid()]
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
export async function PATCH(request: Request) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: "يلزم تسجيل دخول المدير." }, { status: 401 });
  try {
    const body = await request.json() as { id?: unknown; placementX?: unknown; placementY?: unknown; placementWidth?: unknown; placementHeight?: unknown };
    const id = typeof body.id === "string" ? body.id : "";
    const values = [body.placementX, body.placementY, body.placementWidth, body.placementHeight];
    if (!id || values.some(v => typeof v !== "number" || !Number.isFinite(v))) return NextResponse.json({ error: "معرّف الصورة وقياسات الموضع مطلوبة." }, { status: 400 });
    const [x,y,width,height] = values as number[];
    if (x < 0 || x > 100 || y < 0 || y > 100 || width < 5 || width > 100 || height < 5 || height > 100 || x + width > 100 || y + height > 100) return NextResponse.json({ error: "يجب أن تبقى الصورة داخل حدود التصميم (0–100%)." }, { status: 400 });
    await ensureTable();
    const result = await pool().query('UPDATE design_backgrounds SET placement_x=$2, placement_y=$3, placement_width=$4, placement_height=$5 WHERE id=$1 RETURNING id, placement_x AS "placementX", placement_y AS "placementY", placement_width AS "placementWidth", placement_height AS "placementHeight"', [id,x,y,width,height]);
    if (!result.rowCount) return NextResponse.json({ error: "الصورة غير موجودة." }, { status: 404 });
    return NextResponse.json({ asset: result.rows[0] });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return NextResponse.json({ error: "قاعدة البيانات غير متصلة." }, { status: 503 });
    console.error("design_asset_placement_failed", error);
    return NextResponse.json({ error: "تعذر حفظ موضع الصورة." }, { status: 503 });
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
