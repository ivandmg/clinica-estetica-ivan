import { z } from "zod";
import { siteConfig } from "@/lib/config/site";

/**
 * Esquemas de la tabla `settings`. Cada campo tiene un valor por defecto, así
 * el sitio funciona aunque falte algún dato en la base. Los mismos esquemas
 * validan el formulario de Configuración del panel.
 */

const text = (fallback = "") => z.string().trim().max(5000).catch(fallback).prefault(fallback);
const optionalUrl = z
  .union([z.url({ protocol: /^https?$/ }), z.literal("")])
  .catch("")
  .prefault("");

export const openingHourSchema = z.object({
  label: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(60),
});

export const businessSchema = z.object({
  name: text(siteConfig.name),
  tagline: text(siteConfig.tagline),
  description: text(siteConfig.description),
  /** Teléfono en formato internacional: +59165060795 */
  phone: text(),
  /** Número de WhatsApp solo dígitos, con código de país: 59165060795 */
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .catch("")
    .prefault(""),
  email: text(),
  address: text(),
  city: text(`${siteConfig.city}, ${siteConfig.country}`),
  /** Link para el botón "Cómo llegar" */
  maps_url: optionalUrl,
  /** URL del iframe del mapa (Google Maps → Compartir → Insertar un mapa → src) */
  maps_embed_url: optionalUrl,
  geo: z
    .object({ lat: z.number(), lng: z.number() })
    .nullable()
    .catch(null)
    .prefault(null),
  social: z
    .object({
      instagram: optionalUrl,
      tiktok: optionalUrl,
      facebook: optionalUrl,
    })
    .prefault({}),
  opening_hours: z.array(openingHourSchema).max(10).catch([]).prefault([]),
});

const sectionHeader = (title: string, eyebrow = "", subtitle = "") =>
  z
    .object({ eyebrow: text(eyebrow), title: text(title), subtitle: text(subtitle) })
    .prefault({});

export const WHY_US_ICONS = [
  "stethoscope",
  "sparkles",
  "shield-check",
  "heart-handshake",
  "award",
  "clock",
  "leaf",
  "smile",
] as const;

export const contentSchema = z.object({
  hero: z
    .object({
      eyebrow: text(),
      title: text(siteConfig.tagline),
      subtitle: text(),
      image_url: optionalUrl,
    })
    .prefault({}),
  about: z
    .object({
      eyebrow: text("Sobre nosotros"),
      title: text("Sobre nosotros"),
      body: text(),
      image_url: optionalUrl,
      highlights: z
        .array(z.object({ value: z.string().max(20), label: z.string().max(60) }))
        .max(4)
        .catch([])
        .prefault([]),
    })
    .prefault({}),
  treatments: sectionHeader("Tratamientos destacados", "Tratamientos"),
  team: sectionHeader("Nuestro equipo", "Equipo"),
  why_us: z
    .object({
      eyebrow: text("Por qué elegirnos"),
      title: text("Por qué elegirnos"),
      items: z
        .array(
          z.object({
            icon: z.enum(WHY_US_ICONS).catch("sparkles"),
            title: z.string().max(80),
            text: z.string().max(400),
          }),
        )
        .max(8)
        .catch([])
        .prefault([]),
    })
    .prefault({}),
  how_to_book: z
    .object({
      eyebrow: text("Cómo reservar"),
      title: text("Cómo reservar"),
      steps: z
        .array(z.object({ title: z.string().max(80), text: z.string().max(400) }))
        .max(5)
        .catch([])
        .prefault([]),
    })
    .prefault({}),
  testimonials: sectionHeader("Lo que dicen nuestros pacientes", "Testimonios"),
  faq: sectionHeader("Preguntas frecuentes", "FAQ"),
  location: sectionHeader("Ubicación", "Ubicación"),
  cta: z
    .object({ title: text("Reservá tu cita"), text: text() })
    .prefault({}),
  booking: z
    .object({
      cancellation_policy: text(
        "Podés cancelar tu cita desde el link de tu reserva hasta 24 horas antes. Pasado ese plazo, escribinos por WhatsApp.",
      ),
      confirmation_note: text(),
    })
    .prefault({}),
  legal: z.object({ privacy: text(), terms: text() }).prefault({}),
});

export const bookingRulesSchema = z.object({
  min_advance_minutes: z.coerce.number().int().min(0).max(10080),
  max_advance_days: z.coerce.number().int().min(1).max(365),
  buffer_minutes: z.coerce.number().int().min(0).max(120),
  slot_interval_minutes: z.coerce
    .number()
    .int()
    .refine((v) => [10, 15, 20, 30, 60].includes(v), "Elegí 10, 15, 20, 30 o 60 minutos"),
  cancellation_hours: z.coerce.number().int().min(0).max(168),
  max_daily_bookings_per_contact: z.coerce.number().int().min(1).max(50),
});

export type Business = z.infer<typeof businessSchema>;
export type SiteContent = z.infer<typeof contentSchema>;
export type BookingRules = z.infer<typeof bookingRulesSchema>;

export interface Settings {
  business: Business;
  content: SiteContent;
  rules: BookingRules;
}

export const DEFAULT_RULES: BookingRules = {
  min_advance_minutes: 120,
  max_advance_days: 60,
  buffer_minutes: 15,
  slot_interval_minutes: 30,
  cancellation_hours: 24,
  max_daily_bookings_per_contact: 3,
};

/** Convierte la fila cruda de `settings` en un objeto validado y con valores por defecto. */
export function parseSettings(row: Record<string, unknown> | null | undefined): Settings {
  const r = row ?? {};
  const rules = bookingRulesSchema.safeParse(r);
  return {
    business: businessSchema.parse(r.business ?? {}),
    content: contentSchema.parse(r.content ?? {}),
    rules: rules.success ? rules.data : DEFAULT_RULES,
  };
}
