import type { Professional } from "@/lib/types";
import type { SiteContent } from "@/lib/validation/settings";
import { Reveal } from "../reveal";
import { SectionHeader } from "../section-header";
import { SmartImage } from "../smart-image";

export function Team({
  header,
  professionals,
}: {
  header: SiteContent["team"];
  professionals: Professional[];
}) {
  if (professionals.length === 0) return null;
  return (
    <section id="equipo" className="section scroll-mt-20">
      <div className="container-page space-y-12">
        <SectionHeader {...header} />
        <ul className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
          {professionals.map((p, i) => (
            <Reveal as="li" key={p.id} delay={i * 100}>
              <article className="flex h-full flex-col overflow-hidden rounded-3xl border bg-white shadow-sm">
                <div className="relative aspect-[4/4] bg-brand-50 sm:aspect-[4/3.6]">
                  <SmartImage
                    src={p.photo_url}
                    alt={p.name}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="space-y-2 p-6">
                  <h3 className="text-2xl font-semibold">{p.name}</h3>
                  <p className="text-sm font-medium text-brand-500">{p.title}</p>
                  <p className="text-sm leading-relaxed text-ink-600">{p.bio}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
