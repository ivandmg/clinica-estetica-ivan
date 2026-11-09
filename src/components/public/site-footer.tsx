import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type { Business } from "@/lib/validation/settings";
import { formatPhone } from "@/lib/format";
import { SocialLinks } from "./social-links";
import { NAV_LINKS } from "./nav-links";

export function SiteFooter({ business }: { business: Business }) {
  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-1">
          <Logo tone="white" />
          <p className="text-sm leading-relaxed text-brand-200/80">{business.tagline}</p>
          <SocialLinks business={business} tone="dark" />
        </div>

        <div className="space-y-4">
          <h2 className="font-sans text-sm font-semibold tracking-wider text-white uppercase">
            Horarios
          </h2>
          <ul className="space-y-2 text-sm">
            {business.opening_hours.map((h) => (
              <li key={h.label} className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand-300" />
                <span>
                  <span className="text-brand-200/80">{h.label}:</span> {h.value}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="font-sans text-sm font-semibold tracking-wider text-white uppercase">
            Contacto
          </h2>
          <ul className="space-y-2.5 text-sm">
            {business.address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-300" />
                <span>
                  {business.address}
                  {business.city && <span className="block text-brand-200/80">{business.city}</span>}
                </span>
              </li>
            )}
            {business.phone && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-brand-300" />
                <a href={`tel:${business.phone}`} className="hover:text-white">
                  {formatPhone(business.phone)}
                </a>
              </li>
            )}
            {business.email && (
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-brand-300" />
                <a href={`mailto:${business.email}`} className="break-all hover:text-white">
                  {business.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="font-sans text-sm font-semibold tracking-wider text-white uppercase">
            Navegación
          </h2>
          <ul className="space-y-2 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/reservar" className="font-medium text-white hover:underline">
                Reservar cita
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-brand-200/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CopyrightYear /> {business.name}. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="/privacidad" className="hover:text-white">
              Política de privacidad
            </Link>
            <Link href="/terminos" className="hover:text-white">
              Términos y condiciones
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function CopyrightYear() {
  return <>{new Date().getFullYear()}</>;
}
