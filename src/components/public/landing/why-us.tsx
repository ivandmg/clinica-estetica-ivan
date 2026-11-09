import {
  Award,
  Clock,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Smile,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import type { SiteContent } from "@/lib/validation/settings";
import { Reveal } from "../reveal";
import { SectionHeader } from "../section-header";

export const WHY_US_ICON_MAP: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  sparkles: Sparkles,
  "shield-check": ShieldCheck,
  "heart-handshake": HeartHandshake,
  award: Award,
  clock: Clock,
  leaf: Leaf,
  smile: Smile,
};

export function WhyUs({ whyUs }: { whyUs: SiteContent["why_us"] }) {
  if (whyUs.items.length === 0) return null;
  return (
    <section className="section bg-brand-900 text-white">
      <div className="container-page space-y-12">
        <SectionHeader
          eyebrow={whyUs.eyebrow}
          title={whyUs.title}
          className="[&_.eyebrow]:text-brand-300 [&_h2]:text-white"
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyUs.items.map((item, i) => {
            const Icon = WHY_US_ICON_MAP[item.icon] ?? Sparkles;
            return (
              <Reveal as="li" key={item.title} delay={i * 80}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
                  <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-brand-500/30 text-brand-100">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="font-sans text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-100/80">{item.text}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
