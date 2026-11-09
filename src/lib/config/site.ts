/**
 * ⭐ CONFIGURACIÓN DE MARCA DE LA PLANTILLA
 *
 * Este es el primer archivo a editar para reutilizar la plantilla en otro negocio.
 * Los datos que el manager puede cambiar desde el panel (textos, redes, dirección,
 * reglas de reserva…) se guardan en la tabla `settings` de la base de datos; los
 * valores de aquí son solo los valores por defecto/fallback y lo que no cambia
 * en el día a día (zona horaria, moneda, idioma).
 */
export const siteConfig = {
  name: "Clínica Estética Ivan",
  shortName: "Clínica Ivan",
  /** Primera línea del logo horizontal (pequeña, en mayúsculas) */
  logoTop: "Clínica Estética",
  /** Segunda línea del logo horizontal (serif grande) */
  logoBottom: "Ivan",
  tagline: "Medicina estética con resultados naturales",
  description:
    "Clínica de medicina estética en Santa Cruz de la Sierra dirigida por el Dr. Ivan Melgar. Tratamientos faciales, corporales e inyectables con resultados naturales, seguridad y atención personalizada.",
  city: "Santa Cruz de la Sierra",
  country: "Bolivia",
  countryCode: "BO",
  locale: "es-BO",
  /** Locale para formatear fechas con date-fns */
  timeZone: "America/La_Paz",
  currency: {
    code: "BOB",
    symbol: "Bs",
  },
  /** Prefijo telefónico del país (sin +) */
  phoneCountryCode: "591",
  managerEmail: "ivandmg150@gmail.com",
  /** Colores usados donde no llega Tailwind (correos, Open Graph, manifest) */
  colors: {
    primary: "#0F2E52", // azul profundo
    accent: "#3479C2", // azul medio
    light: "#EEF5FC", // azul muy claro
    text: "#334155", // gris neutro
    muted: "#64748B",
    white: "#FFFFFF",
  },
} as const;

export type SiteConfig = typeof siteConfig;

/** URL pública del sitio (sin barra final). */
export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return url.replace(/\/$/, "");
}
