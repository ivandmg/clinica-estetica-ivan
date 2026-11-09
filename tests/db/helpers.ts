import fs from "node:fs";
import path from "node:path";
import { Client, Pool } from "pg";

/**
 * Crea una base de datos NUEVA y vacía, aplica el shim de Supabase, las
 * migraciones y el seed. Requiere TEST_DATABASE_URL apuntando a un Postgres
 * local (NUNCA a producción), p. ej.:
 *   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
 */
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

const root = path.resolve(__dirname, "../..");

export async function createTestDatabase(name: string): Promise<Pool> {
  if (!TEST_DATABASE_URL) throw new Error("Falta TEST_DATABASE_URL");
  const admin = new Client({ connectionString: TEST_DATABASE_URL });
  await admin.connect();
  await admin.query(`drop database if exists ${name} with (force)`);
  await admin.query(`create database ${name}`);
  await admin.end();

  const url = new URL(TEST_DATABASE_URL);
  url.pathname = `/${name}`;
  const pool = new Pool({ connectionString: url.toString(), max: 10 });

  const migrationsDir = path.join(root, "supabase/migrations");
  const files = [
    path.join(root, "tests/db/supabase-shim.sql"),
    ...fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => path.join(migrationsDir, f)),
    path.join(root, "supabase/seed.sql"),
  ];
  for (const file of files) {
    await pool.query(fs.readFileSync(file, "utf8"));
  }
  return pool;
}

export async function dropTestDatabase(pool: Pool, name: string) {
  await pool.end();
  const admin = new Client({ connectionString: TEST_DATABASE_URL });
  await admin.connect();
  await admin.query(`drop database if exists ${name} with (force)`);
  await admin.end();
}

/** Ejecuta `fn` como un rol de Supabase (anon / authenticated) dentro de una transacción. */
export async function asRole<T>(
  pool: Pool,
  role: "anon" | "authenticated",
  fn: (q: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>) => Promise<T>,
  userId?: string,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${role}`);
    if (userId) {
      await client.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
    }
    const result = await fn((sql, params) => client.query(sql, params));
    await client.query("rollback");
    return result;
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
