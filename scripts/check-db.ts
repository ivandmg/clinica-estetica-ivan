/**
 * Verifica la conexión con Supabase y que la seguridad (RLS) esté activa.
 * Uso: npm run db:check
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let failures = 0;
const ok = (msg: string) => console.log(`  ✓ ${msg}`);
const fail = (msg: string) => {
  failures++;
  console.log(`  ✗ ${msg}`);
};

async function main() {
  if (!url || !anonKey || !serviceKey) {
    throw new Error(
      "Faltan variables en .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  console.log("\nAcceso público (clave anon):");
  const { data: treatments, error } = await anon.from("treatments").select("name");
  if (error) fail(`No se pudo leer el catálogo: ${error.message}`);
  else ok(`Lee el catálogo: ${treatments.length} tratamientos visibles`);

  const { data: pros } = await anon.from("professionals").select("name");
  ok(`Profesionales activos: ${pros?.map((p) => p.name).join(", ") ?? "—"}`);

  const { data: bookings } = await anon.from("bookings").select("id");
  if (bookings && bookings.length > 0) fail("¡El público PUEDE leer reservas! Revisá RLS.");
  else ok("El público NO puede leer reservas (RLS activo)");

  const { error: insertError } = await anon.from("categories").insert({ name: "x", slug: "x" });
  if (insertError) ok("El público NO puede modificar el catálogo");
  else fail("¡El público PUDO crear una categoría! Revisá RLS.");

  console.log("\nAcceso del servidor (clave service_role):");
  const { count, error: countError } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true });
  if (countError) fail(`No se pudo leer reservas con la service_role: ${countError.message}`);
  else ok(`Lee reservas: ${count} en total`);

  const { data: managers } = await admin.from("admin_users").select("email");
  if (!managers?.length) console.log("  • Todavía no hay manager. Crealo con: npm run manager:create");
  else ok(`Manager: ${managers.map((m) => m.email).join(", ")}`);

  const { data: bucket } = await admin.storage.getBucket("images");
  if (bucket?.public) ok("Bucket de imágenes 'images' listo (público)");
  else fail("No se encontró el bucket 'images'");

  console.log(failures ? `\n✗ ${failures} problema(s)\n` : "\n✓ Todo en orden\n");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  process.exit(1);
});
