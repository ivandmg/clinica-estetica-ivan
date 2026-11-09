// Junta todas las migraciones + el seed en un único archivo para pegar en el
// SQL Editor de Supabase: supabase/setup-completo.sql
// Uso: npm run db:bundle
import fs from "node:fs";
import path from "node:path";

const dir = "supabase/migrations";
const parts = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => `-- >>> ${dir}/${f}\n${fs.readFileSync(path.join(dir, f), "utf8")}`);
parts.push(`-- >>> supabase/seed.sql\n${fs.readFileSync("supabase/seed.sql", "utf8")}`);

const header = `-- =============================================================================
-- ARCHIVO GENERADO con "npm run db:bundle". No lo edites a mano.
-- Pegalo completo en Supabase → SQL Editor → New query → Run (solo en una base NUEVA).
-- =============================================================================\n\n`;
fs.writeFileSync("supabase/setup-completo.sql", header + parts.join("\n\n"));
console.log("✓ supabase/setup-completo.sql generado");
