import { NextResponse } from "next/server";
import { Pool } from "pg";
import { isAdminSessionValid } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DesignTemplate = { id: string; title: string; category: string; description: string; image: string; published: boolean; updatedAt?: string };
const globalForPool = globalThis as typeof globalThis & { roknDesignPool?: Pool };
function pool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_MISSING");
  if (!globalForPool.roknDesignPool) globalForPool.roknDesignPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    max: 3,
  });
  return globalForPool.roknDesignPool;
}
let schemaReady: Promise<void> | null = null;
async function ensureTable() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool().query(`CREATE TABLE IF NOT EXISTS design_templates (
          id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'عام',
          description TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '',
          published BOOLEAN NOT NULL DEFAULT TRUE, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
    })().catch((error) => { schemaReady = null; throw error; });
  }
  await schemaReady;
}function unavailable() {
  return NextResponse.json({ error: "تخزين القوالب غير مربوط بعد. يلزم ربط DATABASE_URL بقاعدة PostgreSQL في Render." }, { status: 503 });
}
export async function GET() {
  try {
    await ensureTable();
    const admin = await isAdminSessionValid();
    const result = await pool().query(
      admin
        ? "SELECT id,title,category,description,image,published,updated_at AS \"updatedAt\" FROM design_templates ORDER BY updated_at DESC"
        : "SELECT id,title,category,description,image,published,updated_at AS \"updatedAt\" FROM design_templates WHERE published = TRUE ORDER BY updated_at DESC"
    );
    return NextResponse.json({ templates: result.rows });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return unavailable();
    console.error("design_templates_get_failed", error);
    return NextResponse.json({ error: "تعذر تحميل القوالب من قاعدة البيانات." }, { status: 503 });
  }
}
export async function POST(request: Request) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: "يلزم تسجيل دخول المدير." }, { status: 401 });
  try {
    const body = await request.json() as Partial<DesignTemplate>;
    const id = typeof body.id === "string" && body.id.trim() ? body.id.slice(0,100) : crypto.randomUUID();
    const title = typeof body.title === "string" ? body.title.trim().slice(0,120) : "";
    const category = typeof body.category === "string" ? body.category.trim().slice(0,80) : "عام";
    const description = typeof body.description === "string" ? body.description.trim().slice(0,500) : "";
    const image = typeof body.image === "string" ? body.image : "";
    const published = body.published !== false;
    if (!title) return NextResponse.json({ error: "اسم القالب مطلوب." }, { status: 400 });
    if (image.length > 8_000_000) return NextResponse.json({ error: "الصورة كبيرة جدًا؛ استخدم صورة أقل من 6 ميغابايت." }, { status: 413 });
    if (image && !/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,/.test(image)) return NextResponse.json({ error: "صيغة الصورة غير مدعومة." }, { status: 400 });
    await ensureTable();
    const result = await pool().query(
      `INSERT INTO design_templates (id,title,category,description,image,published,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,category=EXCLUDED.category,
       description=EXCLUDED.description,image=EXCLUDED.image,published=EXCLUDED.published,updated_at=NOW()
       RETURNING id,title,category,description,image,published,updated_at AS "updatedAt"`,
      [id,title,category || "عام",description,image,published]
    );
    return NextResponse.json({ template: result.rows[0] });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return unavailable();
    console.error("design_template_save_failed", error);
    return NextResponse.json({ error: "تعذر حفظ القالب. تحقق من اتصال قاعدة البيانات." }, { status: 503 });
  }
}
export async function DELETE(request: Request) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: "يلزم تسجيل دخول المدير." }, { status: 401 });
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "معرّف القالب مطلوب." }, { status: 400 });
    await ensureTable();
    await pool().query("DELETE FROM design_templates WHERE id = $1", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL_MISSING") return unavailable();
    console.error("design_template_delete_failed", error);
    return NextResponse.json({ error: "تعذر حذف القالب." }, { status: 503 });
  }
}
