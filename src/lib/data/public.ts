import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { parseSettings, type Settings } from "@/lib/validation/settings";
import type {
  Category,
  Faq,
  Professional,
  Testimonial,
  TreatmentWithRelations,
} from "@/lib/types";
import { CACHE_TAGS, PUBLIC_REVALIDATE_SECONDS } from "./tags";

/*
 * Lecturas PÚBLICAS (respetan RLS: solo lo visible/activo), cacheadas.
 * Se invalidan desde el panel con revalidateTag(CACHE_TAGS.x).
 */

const cached = <A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  key: string,
  tags: string[],
) => unstable_cache(fn, [key], { tags, revalidate: PUBLIC_REVALIDATE_SECONDS });

export const getSettings = cached(
  async (): Promise<Settings> => {
    const { data, error } = await createPublicClient()
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la configuración: ${error.message}`);
    return parseSettings(data);
  },
  "settings",
  [CACHE_TAGS.settings],
);

export const getCategories = cached(
  async (): Promise<Category[]> => {
    const { data, error } = await createPublicClient()
      .from("categories")
      .select("*")
      .order("sort_order")
      .order("name");
    if (error) throw new Error(`No se pudieron leer las categorías: ${error.message}`);
    return data ?? [];
  },
  "categories",
  [CACHE_TAGS.catalog],
);

const TREATMENT_SELECT = `
  *,
  category:categories!inner ( id, name, slug, sort_order ),
  treatment_professionals ( professional:professionals ( id, name, slug, title, photo_url, sort_order ) )
`;

type TreatmentRow = Omit<TreatmentWithRelations, "professionals" | "category"> & {
  category: TreatmentWithRelations["category"] & { sort_order: number };
  treatment_professionals: {
    professional: (TreatmentWithRelations["professionals"][number] & { sort_order: number }) | null;
  }[];
};

function mapTreatment(row: TreatmentRow): TreatmentWithRelations {
  const { treatment_professionals, category, ...rest } = row;
  return {
    ...rest,
    price: rest.price === null ? null : Number(rest.price),
    category: { id: category.id, name: category.name, slug: category.slug },
    professionals: treatment_professionals
      .map((tp) => tp.professional)
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({ id: p.id, name: p.name, slug: p.slug, title: p.title, photo_url: p.photo_url })),
  };
}

/** Todos los tratamientos visibles, ordenados por categoría y orden. */
export const getTreatments = cached(
  async (): Promise<TreatmentWithRelations[]> => {
    const { data, error } = await createPublicClient()
      .from("treatments")
      .select(TREATMENT_SELECT)
      .order("sort_order")
      .order("name");
    if (error) throw new Error(`No se pudieron leer los tratamientos: ${error.message}`);
    return ((data ?? []) as unknown as TreatmentRow[])
      .sort((a, b) => a.category.sort_order - b.category.sort_order)
      .map(mapTreatment);
  },
  "treatments",
  [CACHE_TAGS.catalog, CACHE_TAGS.team],
);

export async function getTreatmentBySlug(slug: string) {
  const all = await getTreatments();
  return all.find((t) => t.slug === slug) ?? null;
}

export async function getFeaturedTreatments(limit = 6) {
  const all = await getTreatments();
  const featured = all.filter((t) => t.is_featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export const getProfessionals = cached(
  async (): Promise<Professional[]> => {
    const { data, error } = await createPublicClient()
      .from("professionals")
      .select("*")
      .order("sort_order")
      .order("name");
    if (error) throw new Error(`No se pudieron leer los profesionales: ${error.message}`);
    return data ?? [];
  },
  "professionals",
  [CACHE_TAGS.team],
);

export const getTestimonials = cached(
  async (): Promise<Testimonial[]> => {
    const { data, error } = await createPublicClient()
      .from("testimonials")
      .select("*")
      .order("sort_order");
    if (error) throw new Error(`No se pudieron leer los testimonios: ${error.message}`);
    return data ?? [];
  },
  "testimonials",
  [CACHE_TAGS.content],
);

export const getFaqs = cached(
  async (): Promise<Faq[]> => {
    const { data, error } = await createPublicClient().from("faqs").select("*").order("sort_order");
    if (error) throw new Error(`No se pudieron leer las preguntas frecuentes: ${error.message}`);
    return data ?? [];
  },
  "faqs",
  [CACHE_TAGS.content],
);
