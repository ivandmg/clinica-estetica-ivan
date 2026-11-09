/**
 * Crea (o actualiza) el usuario MANAGER del panel /admin.
 *
 * Uso:
 *   npm run manager:create -- ivandmg150@gmail.com "UnaContraseñaSegura123"
 *
 * Si no pasás argumentos usa MANAGER_EMAIL de .env.local y te pide la contraseña.
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.
 */
import { config } from "dotenv";
import { createInterface } from "node:readline/promises";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  }

  const [, , argEmail, argPassword] = process.argv;
  const email = (argEmail ?? process.env.MANAGER_EMAIL ?? "").trim().toLowerCase();
  if (!email) throw new Error("Indicá el correo: npm run manager:create -- correo@ejemplo.com");

  let password = argPassword;
  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question(`Contraseña para ${email} (mínimo 10 caracteres): `);
    rl.close();
  }
  if (!password || password.length < 10) {
    throw new Error("La contraseña debe tener al menos 10 caracteres.");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ¿Ya existe?
  let userId: string | undefined;
  for (let page = 1; page < 50 && !userId; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
    if (data.users.length < 200) break;
  }

  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`✓ Usuario existente actualizado: ${email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`✓ Usuario creado: ${email}`);
  }

  const { error: adminError } = await supabase
    .from("admin_users")
    .upsert({ user_id: userId, email }, { onConflict: "user_id" });
  if (adminError) throw adminError;

  console.log("✓ Permisos de manager asignados. Ya podés entrar en /admin/login");
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
