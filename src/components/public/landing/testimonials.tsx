import { Quote, Star } from "lucide-react";
import type { Testimonial } from "@/lib/types";
import type { SiteContent } from "@/lib/validation/settings";
import { Reveal } from "../reveal";
import { SectionHeader } from "../section-header";

export function Testimonials({
  header,
  testimonials,
}: {
  header: SiteContent["testimonials"];
  testimonials: Testimonial[];
}) {
  if (testimonials.length === 0) return null;
  return (
    <section className="section bg-brand-50/70">
      <div className="container-page space-y-12">
        <SectionHeader {...header} />
        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
          {testimonials.map((t, i) => (
            <Reveal
              as="li"
              key={t.id}
              delay={i * 100}
              className="w-[85%] shrink-0 snap-center sm:w-[60%] md:w-auto"
            >
              <figure className="flex h-full flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5" aria-label={`${t.rating} de 5 estrellas`}>
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star
                        key={s}
                        className={
                          s < t.rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-ink-300"
                        }
                      />
                    ))}
                  </div>
                  <Quote className="size-8 text-brand-100" />
                </div>
                <blockquote className="flex-1 leading-relaxed text-ink-600">“{t.content}”</blockquote>
                <figcaption>
                  <div className="font-semibold text-brand-900">{t.author_name}</div>
                  {t.author_detail && <div className="text-sm text-ink-500">{t.author_detail}</div>}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
