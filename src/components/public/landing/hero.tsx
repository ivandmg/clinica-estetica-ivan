import Link from "next/link";
import { CalendarCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SiteContent } from "@/lib/validation/settings";
import { SmartImage } from "../smart-image";

export function Hero({ hero }: { hero: SiteContent["hero"] }) {
  return (
    <section className="relative isolate overflow-hidden bg-brand-950">
      <SmartImage
        src={hero.image_url}
        alt=""
        fill
        priority
        fallbackTone="dark"
        fetchPriority="high"
        sizes="100vw"
        className="-z-10 object-cover object-[70%_center] opacity-90"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-950/95 via-brand-950/70 to-brand-950/30 sm:bg-gradient-to-r sm:from-brand-950/90 sm:via-brand-950/60 sm:to-transparent" />
      <div className="container-page flex min-h-[78svh] flex-col justify-end pt-28 pb-14 sm:min-h-[80vh] sm:justify-center sm:py-28">
        <div className="max-w-2xl space-y-6 text-white">
          {hero.eyebrow && (
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium tracking-wide backdrop-blur">
              <Sparkles className="size-3.5 text-brand-200" /> {hero.eyebrow}
            </p>
          )}
          <h1 className="animate-fade-up text-[2.6rem] leading-[1.05] font-semibold text-white [animation-delay:80ms] sm:text-6xl lg:text-7xl">
            {hero.title}
          </h1>
          {hero.subtitle && (
            <p className="max-w-xl animate-fade-up text-base leading-relaxed text-brand-50/90 [animation-delay:160ms] sm:text-lg">
              {hero.subtitle}
            </p>
          )}
          <div className="flex animate-fade-up flex-col gap-3 pt-2 [animation-delay:240ms] sm:flex-row">
            <Button asChild size="lg" variant="white">
              <Link href="/reservar">
                <CalendarCheck /> Reservar cita
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/5 text-white backdrop-blur hover:border-white hover:bg-white/15"
            >
              <Link href="/tratamientos">Ver tratamientos</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
