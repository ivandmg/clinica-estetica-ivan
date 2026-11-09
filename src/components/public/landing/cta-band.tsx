import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { LogoIcon } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import type { SiteContent } from "@/lib/validation/settings";

export function CtaBand({ cta }: { cta: SiteContent["cta"] }) {
  return (
    <section className="section">
      <div className="container-page">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 px-6 py-14 text-center text-white sm:px-12 sm:py-16">
          <LogoIcon
            tone="white"
            className="absolute -top-10 -right-10 -z-10 size-56 rotate-12 opacity-[0.06]"
          />
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold text-white sm:text-4xl">{cta.title}</h2>
          {cta.text && <p className="mx-auto mt-4 max-w-xl text-brand-100/90">{cta.text}</p>}
          <Button asChild size="lg" variant="white" className="mt-8">
            <Link href="/reservar">
              <CalendarCheck /> Reservar cita
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
