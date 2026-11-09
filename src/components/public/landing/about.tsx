import type { SiteContent } from "@/lib/validation/settings";
import { Reveal } from "../reveal";
import { SmartImage } from "../smart-image";

export function About({ about }: { about: SiteContent["about"] }) {
  return (
    <section id="nosotros" className="section scroll-mt-20">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal className="relative order-2 lg:order-1">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-brand-50 sm:aspect-[5/4] lg:aspect-[4/5]">
            <SmartImage
              src={about.image_url}
              alt="Nuestra clínica"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div
            aria-hidden
            className="absolute -bottom-5 -left-5 -z-10 hidden size-40 rounded-[2rem] bg-brand-100 sm:block"
          />
        </Reveal>
        <Reveal className="order-1 space-y-6 lg:order-2">
          <p className="eyebrow">{about.eyebrow}</p>
          <h2 className="text-3xl leading-tight font-semibold sm:text-4xl lg:text-[2.75rem]">
            {about.title}
          </h2>
          <div className="space-y-4 leading-relaxed text-ink-600">
            {about.body.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {about.highlights.length > 0 && (
            <dl className="grid grid-cols-3 gap-3 pt-2">
              {about.highlights.map((h) => (
                <div key={h.label} className="rounded-2xl bg-brand-50 p-4 text-center">
                  <dt className="sr-only">{h.label}</dt>
                  <dd className="font-serif text-3xl font-semibold text-brand-900 sm:text-4xl">
                    {h.value}
                  </dd>
                  <dd className="mt-1 text-xs leading-snug text-ink-500 sm:text-sm">{h.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </Reveal>
      </div>
    </section>
  );
}
