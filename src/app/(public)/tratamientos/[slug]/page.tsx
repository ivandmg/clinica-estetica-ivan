import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  HeartPulse,
  Repeat,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/public/json-ld";
import { SmartImage } from "@/components/public/smart-image";
import { WhatsAppIcon } from "@/components/public/social-icons";
import { TreatmentCard } from "@/components/public/treatment-card";
import { getSettings, getTreatmentBySlug, getTreatments } from "@/lib/data/public";
import { formatDuration, formatPrice } from "@/lib/format";
import { treatmentJsonLd } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const treatments = await getTreatments();
    return treatments.map((t) => ({ slug: t.slug }));
  } catch {
    // Sin base de datos durante el build: se generan bajo demanda.
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/tratamientos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTreatmentBySlug(slug);
  if (!t) return { title: "Tratamiento no encontrado" };
  return {
    title: t.name,
    description: `${t.short_description} ${formatDuration(t.duration_minutes)} · ${formatPrice(t.price)}.`,
    alternates: { canonical: `/tratamientos/${t.slug}` },
    openGraph: {
      title: t.name,
      description: t.short_description,
      images: t.image_url ? [{ url: t.image_url, width: 1200, height: 900, alt: t.name }] : undefined,
    },
  };
}

export default async function TreatmentPage({ params }: PageProps<"/tratamientos/[slug]">) {
  const { slug } = await params;
  const [t, { business }, all] = await Promise.all([
    getTreatmentBySlug(slug),
    getSettings(),
    getTreatments(),
  ]);
  if (!t) notFound();

  const related = all.filter((x) => x.category.id === t.category.id && x.id !== t.id).slice(0, 3);
  const waHref = business.whatsapp
    ? whatsappLink(business.whatsapp, `Hola, quiero más información sobre ${t.name}`)
    : null;

  return (
    <article>
      <JsonLd data={treatmentJsonLd(t, business)} />
      <div className="container-page pt-6">
        <Link
          href="/tratamientos"
          className="inline-flex items-center gap-1.5 rounded-full py-2 text-sm font-medium text-brand-700 hover:text-brand-900"
        >
          <ArrowLeft className="size-4" /> Todos los tratamientos
        </Link>
      </div>

      <div className="container-page grid gap-8 pt-4 pb-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-brand-50 lg:sticky lg:top-28 lg:aspect-[4/4.2] lg:self-start">
          <SmartImage
            src={t.image_url}
            alt={t.name}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="space-y-8">
          <header className="space-y-4">
            <Badge variant="secondary">{t.category.name}</Badge>
            <h1 className="text-4xl leading-tight font-semibold sm:text-5xl">{t.name}</h1>
            <p className="text-lg leading-relaxed text-ink-600">{t.short_description}</p>
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-brand-50 p-4">
                <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-500 uppercase">
                  <Wallet className="size-4" /> Precio
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-brand-900">{formatPrice(t.price)}</dd>
              </div>
              <div className="rounded-2xl bg-brand-50 p-4">
                <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-500 uppercase">
                  <Clock className="size-4" /> Duración
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-brand-900">
                  {formatDuration(t.duration_minutes)}
                </dd>
              </div>
            </dl>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="flex-1">
                <Link href={`/reservar?tratamiento=${t.slug}`}>
                  <CalendarCheck /> Reservar este tratamiento
                </Link>
              </Button>
              {waHref && (
                <Button asChild size="lg" variant="whatsapp" className="flex-1">
                  <a href={waHref} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="size-5" /> Consultar por WhatsApp
                  </a>
                </Button>
              )}
            </div>
            <p className="text-xs text-ink-500">
              Precio referencial. El valor final se confirma en la valoración según tu caso.
            </p>
          </header>

          {t.description && (
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">¿En qué consiste?</h2>
              <p className="leading-relaxed whitespace-pre-line text-ink-600">{t.description}</p>
            </section>
          )}

          {t.benefits.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">Beneficios</h2>
              <ul className="space-y-2.5">
                {t.benefits.map((b) => (
                  <li key={b} className="flex gap-3 text-ink-600">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-500" />
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {t.recommended_sessions && (
              <section className="rounded-2xl border p-5">
                <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-brand-900">
                  <Repeat className="size-5 text-brand-500" /> Sesiones recomendadas
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{t.recommended_sessions}</p>
              </section>
            )}
            {t.aftercare && (
              <section className="rounded-2xl border p-5">
                <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-brand-900">
                  <HeartPulse className="size-5 text-brand-500" /> Cuidados posteriores
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{t.aftercare}</p>
              </section>
            )}
          </div>

          {t.professionals.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">Lo realiza</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {t.professionals.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-2xl border p-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-brand-50">
                      <SmartImage src={p.photo_url} alt={p.name} fill sizes="56px" className="object-cover object-top" />
                    </div>
                    <div>
                      <div className="font-semibold text-brand-900">{p.name}</div>
                      <div className="text-sm text-ink-500">{p.title}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t bg-brand-50/60 py-14">
          <div className="container-page space-y-8">
            <h2 className="text-3xl font-semibold">También te puede interesar</h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}>
                  <TreatmentCard treatment={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Barra fija de reserva en el celular */}
      <div className="sticky bottom-0 z-30 border-t bg-white/95 p-3 pr-20 backdrop-blur sm:hidden">
        <Button asChild size="lg" className="w-full">
          <Link href={`/reservar?tratamiento=${t.slug}`}>
            <CalendarCheck /> Reservar · {formatPrice(t.price)}
          </Link>
        </Button>
      </div>
    </article>
  );
}
