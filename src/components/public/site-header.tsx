"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarCheck, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WhatsAppIcon } from "./social-icons";
import { NAV_LINKS } from "./nav-links";
import { cn } from "@/lib/utils";


export function SiteHeader({ whatsappUrl }: { whatsappUrl: string | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-[background-color,box-shadow,border-color] duration-300",
        scrolled
          ? "border-border bg-white/90 shadow-[0_4px_20px_-12px_rgba(15,46,82,0.25)] backdrop-blur-md"
          : "border-transparent bg-white/70 backdrop-blur-sm",
      )}
    >
      <a
        href="#contenido"
        className="sr-only rounded-md bg-white px-3 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link href="/" aria-label="Ir al inicio" className="shrink-0 rounded-md">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-900",
                pathname === link.href && "text-brand-900",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/reservar">
              <CalendarCheck /> Reservar cita
            </Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0">
              <SheetTitle className="sr-only">Menú</SheetTitle>
              <div className="border-b p-5">
                <Logo />
              </div>
              <nav aria-label="Menú móvil" className="flex flex-col p-3">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3.5 text-lg font-medium text-brand-900 hover:bg-brand-50"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto space-y-3 border-t p-5">
                <Button asChild size="lg" className="w-full">
                  <Link href="/reservar" onClick={() => setOpen(false)}>
                    <CalendarCheck /> Reservar cita
                  </Link>
                </Button>
                {whatsappUrl && (
                  <Button asChild size="lg" variant="whatsapp" className="w-full">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="size-5" /> Escribinos por WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
