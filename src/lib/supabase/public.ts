import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/**
 * Cliente ANÓNIMO sin cookies, para leer datos públicos dentro de funciones
 * cacheadas (catálogo, profesionales, textos). Respeta RLS.
 */
export function createPublicClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
