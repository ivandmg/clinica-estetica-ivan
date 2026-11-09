import { getSiteUrl, siteConfig } from "@/lib/config/site";
import type { Faq, Professional, TreatmentWithRelations } from "@/lib/types";
import type { Business } from "@/lib/validation/settings";

const DAY_MAP: Record<string, string[]> = {
  "lunes a viernes": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "lunes a sábado": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  lunes: ["Monday"],
  martes: ["Tuesday"],
  miércoles: ["Wednesday"],
  jueves: ["Thursday"],
  viernes: ["Friday"],
  sábado: ["Saturday"],
  domingo: ["Sunday"],
};

/** Convierte "Lunes a viernes: 9:00 – 19:00" a OpeningHoursSpecification (si se puede). */
function openingHours(business: Business) {
  return business.opening_hours.flatMap((h) => {
    const days = DAY_MAP[h.label.trim().toLowerCase()];
    const m = h.value.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
    if (!days || !m) return [];
    const pad = (s: string) => s.padStart(2, "0");
    return [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: days,
        opens: `${pad(m[1])}:${m[2]}`,
        closes: `${pad(m[3])}:${m[4]}`,
      },
    ];
  });
}

export function clinicJsonLd(business: Business, professionals: Professional[] = []) {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": ["MedicalClinic", "LocalBusiness"],
    "@id": `${url}/#clinica`,
    name: business.name,
    description: business.description,
    url,
    logo: `${url}/brand/logo-icon.svg`,
    image: `${url}/opengraph-image`,
    telephone: business.phone || undefined,
    email: business.email || undefined,
    priceRange: "Bs 100 – Bs 3.000",
    currenciesAccepted: siteConfig.currency.code,
    medicalSpecialty: "Dermatology",
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: siteConfig.city,
      addressCountry: siteConfig.countryCode,
    },
    geo: business.geo
      ? { "@type": "GeoCoordinates", latitude: business.geo.lat, longitude: business.geo.lng }
      : undefined,
    hasMap: business.maps_url || undefined,
    openingHoursSpecification: openingHours(business),
    sameAs: Object.values(business.social).filter(Boolean),
    employee: professionals.map((p) => ({ "@type": "Person", name: p.name, jobTitle: p.title })),
  };
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function treatmentJsonLd(t: TreatmentWithRelations, business: Business) {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: t.name,
    description: t.short_description,
    url: `${url}/tratamientos/${t.slug}`,
    image: t.image_url ?? undefined,
    procedureType: "https://schema.org/NoninvasiveProcedure",
    provider: { "@type": "MedicalClinic", "@id": `${url}/#clinica`, name: business.name },
    offers:
      t.price !== null
        ? { "@type": "Offer", price: t.price, priceCurrency: siteConfig.currency.code }
        : undefined,
  };
}
