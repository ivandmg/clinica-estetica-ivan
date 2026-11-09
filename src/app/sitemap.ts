import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/config/site";
import { getTreatments } from "@/lib/data/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = getSiteUrl();
  const staticPages: MetadataRoute.Sitemap = [
    { url, changeFrequency: "weekly", priority: 1 },
    { url: `${url}/tratamientos`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${url}/reservar`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${url}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${url}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];
  let treatments: MetadataRoute.Sitemap = [];
  try {
    treatments = (await getTreatments()).map((t) => ({
      url: `${url}/tratamientos/${t.slug}`,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch {
    // Sin base de datos: solo páginas estáticas
  }
  return [...staticPages, ...treatments];
}
