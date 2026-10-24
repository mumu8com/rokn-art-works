import { Pool } from "pg";

const globalForStore = globalThis as typeof globalThis & { roknStorePool?: Pool; roknStoreSchema?: Promise<void> };

export function storePool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_MISSING");
  if (!globalForStore.roknStorePool) {
    globalForStore.roknStorePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
      max: 4,
    });
  }
  return globalForStore.roknStorePool;
}

export async function ensureStoreSchema() {
  if (!globalForStore.roknStoreSchema) {
    globalForStore.roknStoreSchema = (async () => {
      const db = storePool();
      await db.query(`CREATE TABLE IF NOT EXISTS store_products (
        id BIGINT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'أخرى',
        price TEXT NOT NULL DEFAULT 'حسب الطلب', status TEXT NOT NULL DEFAULT 'مسودة',
        description TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await db.query(`CREATE TABLE IF NOT EXISTS store_orders (
        id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, phone TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '', product_id BIGINT, product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1, details TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'جديد', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await db.query(`CREATE TABLE IF NOT EXISTS store_quotes (
        id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, phone TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '', product_id BIGINT, product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1, details TEXT NOT NULL DEFAULT '',
        estimated_price TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'بانتظار التسعير',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await db.query("CREATE INDEX IF NOT EXISTS store_orders_created_at_idx ON store_orders(created_at DESC)");
      await db.query("CREATE INDEX IF NOT EXISTS store_quotes_created_at_idx ON store_quotes(created_at DESC)");
    })().catch(error => { globalForStore.roknStoreSchema = undefined; throw error; });
  }
  await globalForStore.roknStoreSchema;
}
