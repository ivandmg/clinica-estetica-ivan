import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SiteContent } from "@/lib/validation/settings";
import { Reveal } from "../reveal";
import { SectionHeader } from "../section-header";

export function HowToBook({ howTo }: { howTo: SiteContent["how_to_book"] }) {
  if (howTo.steps.length === 0) return null;
  return (
    <section className="section">
      <div className="container-page space-y-12">
        <SectionHeader eyebrow={howTo.eyebrow} title={howTo.title} />
        <ol className="relative grid gap-6 md:grid-cols-3">
          <div
            aria-hidden
            className="absolute top-7 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-brand-100 via-brand-300 to-brand-100 md:block"
          />
          {howTo.steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 120} className="relative text-center">
              <span className="relative mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-brand-900 font-serif text-2xl font-semibold text-white ring-8 ring-white">
                {i + 1}
              </span>
              <h3 className="font-sans text-lg font-semibold text-brand-900">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-500">
                {step.text}
              </p>
            </Reveal>
          ))}
        </ol>
        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/reservar">
              <CalendarCheck /> Reservar ahora
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
