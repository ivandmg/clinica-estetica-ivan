import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Business, SiteContent } from "@/lib/validation/settings";
import { formatPhone } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { SectionHeader } from "../section-header";
import { WhatsAppIcon } from "../social-icons";

export function Location({
  header,
  business,
}: {
  header: SiteContent["location"];
  business: Business;
}) {
  return (
    <section id="ubicacion" className="section scroll-mt-20 bg-brand-50/70">
      <div className="container-page space-y-12">
        <SectionHeader {...header} />
        <div className="grid overflow-hidden rounded-3xl border bg-white shadow-sm lg:grid-cols-[1.4fr_1fr]">
          <div className="relative min-h-72 bg-brand-100 lg:min-h-[28rem]">
            {business.maps_embed_url ? (
              <iframe
                src={business.maps_embed_url}
                title={`Mapa: ${business.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="absolute inset-0 size-full border-0"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-brand-700">
                <MapPin className="size-10" />
              </div>
            )}
          </div>
          <div className="space-y-6 p-6 sm:p-8">
            <div className="flex gap-3">
              <MapPin className="mt-1 size-5 shrink-0 text-brand-500" />
              <div>
                <h3 className="font-sans text-base font-semibold text-brand-900">Dirección</h3>
                <p className="text-ink-600">{business.address}</p>
                <p className="text-sm text-ink-500">{business.city}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="mt-1 size-5 shrink-0 text-brand-500" />
              <div className="flex-1">
                <h3 className="font-sans text-base font-semibold text-brand-900">Horarios</h3>
                <dl className="mt-1 space-y-1 text-sm">
                  {business.opening_hours.map((h) => (
                    <div key={h.label} className="flex justify-between gap-4 border-b border-dashed py-1 last:border-0">
                      <dt className="text-ink-500">{h.label}</dt>
                      <dd className="font-medium text-ink-700">{h.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            {business.phone && (
              <div className="flex gap-3">
                <Phone className="mt-1 size-5 shrink-0 text-brand-500" />
                <div>
                  <h3 className="font-sans text-base font-semibold text-brand-900">Teléfono</h3>
                  <a href={`tel:${business.phone}`} className="text-ink-600 hover:text-brand-700">
                    {formatPhone(business.phone)}
                  </a>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row lg:flex-col xl:flex-row">
              {business.maps_url && (
                <Button asChild size="lg" className="sm:flex-1">
                  <a href={business.maps_url} target="_blank" rel="noopener noreferrer">
                    <Navigation /> Cómo llegar
                  </a>
                </Button>
              )}
              {business.whatsapp && (
                <Button asChild size="lg" variant="whatsapp" className="sm:flex-1">
                  <a href={whatsappLink(business.whatsapp)} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="size-5" /> WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
