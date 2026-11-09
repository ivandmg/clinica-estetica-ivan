import type { Metadata } from "next";
import Image from "next/image";
import { CalendarCheck, MessageCircle } from "lucide-react";
import { Logo, LogoIcon } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice, formatDuration, formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Identidad visual",
  robots: { index: false, follow: false },
};

const swatches = [
  { name: "brand-900 · azul profundo", cls: "bg-brand-900", hex: "#0F2E52", dark: true },
  { name: "brand-700", cls: "bg-brand-700", hex: "#1D4E87", dark: true },
  { name: "brand-500 · azul medio", cls: "bg-brand-500", hex: "#3479C2", dark: true },
  { name: "brand-200", cls: "bg-brand-200", hex: "#BCD6F1" },
  { name: "brand-50 · azul muy claro", cls: "bg-brand-50", hex: "#EEF5FC" },
  { name: "ink-700 · texto", cls: "bg-ink-700", hex: "#334155", dark: true },
  { name: "ink-500 · texto suave", cls: "bg-ink-500", hex: "#64748B", dark: true },
  { name: "blanco", cls: "bg-white border", hex: "#FFFFFF" },
];

/** Página interna (no indexada) para revisar la identidad visual de la plantilla. */
export default function BrandPage() {
  return (
    <main className="container-page space-y-14 py-12">
      <header className="space-y-2">
        <p className="eyebrow">Plantilla · Fase 0</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Identidad visual</h1>
        <p className="max-w-2xl text-ink-500">
          Paleta, tipografías, logos y componentes base. Para personalizar: colores en{" "}
          <code className="rounded bg-brand-50 px-1">src/app/globals.css</code>, logo en{" "}
          <code className="rounded bg-brand-50 px-1">src/components/brand/logo.tsx</code> y datos
          en <code className="rounded bg-brand-50 px-1">src/lib/config/site.ts</code>.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Logos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-center rounded-2xl border p-10">
            <Logo />
          </div>
          <div className="flex items-center justify-center rounded-2xl bg-brand-900 p-10">
            <Logo tone="white" />
          </div>
          <div className="flex items-end justify-center gap-6 rounded-2xl border p-10">
            <LogoIcon className="size-24" />
            <LogoIcon className="size-10" />
            <LogoIcon className="size-5" />
          </div>
          <div className="flex items-center justify-center rounded-2xl bg-brand-900 p-10">
            <LogoIcon tone="white" className="size-24" />
          </div>
        </div>
        <p className="text-sm text-ink-500">
          Archivos SVG en <code>/public/brand</code>:{" "}
          {[
            "logo-horizontal.svg",
            "logo-horizontal-white.svg",
            "logo-icon.svg",
            "logo-icon-white.svg",
          ].map((f) => (
            <a key={f} href={`/brand/${f}`} className="mr-3 text-brand-600 underline" target="_blank">
              {f}
            </a>
          ))}
        </p>
        <div className="flex items-center gap-4 rounded-2xl border p-4">
          <Image src="/brand/logo-horizontal.svg" alt="Logo horizontal (archivo SVG)" width={240} height={51} />
          <span className="text-sm text-ink-500">← archivo SVG estático</span>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Paleta</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map((s) => (
            <div key={s.name} className="overflow-hidden rounded-xl border">
              <div className={`h-20 ${s.cls}`} />
              <div className="p-3 text-xs">
                <div className="font-medium text-ink-800">{s.name}</div>
                <div className="text-ink-500">{s.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tipografía</h2>
        <div className="space-y-3 rounded-2xl bg-brand-50 p-6 sm:p-10">
          <p className="eyebrow">Eyebrow · Inter</p>
          <p className="font-serif text-5xl font-semibold text-brand-900">
            Belleza natural, con respaldo médico
          </p>
          <p className="font-serif text-3xl text-brand-900">Cormorant Garamond para títulos</p>
          <p className="max-w-2xl leading-relaxed">
            Inter para el texto. Tratamientos diseñados para realzar tu belleza respetando tus
            rasgos, con protocolos seguros y un acompañamiento cercano en cada etapa.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Componentes</h2>
        <div className="flex flex-wrap gap-3">
          <Button size="lg">
            <CalendarCheck /> Reservar cita
          </Button>
          <Button size="lg" variant="outline">
            Ver tratamientos
          </Button>
          <Button size="lg" variant="accent">
            Acento
          </Button>
          <Button size="lg" variant="whatsapp">
            <MessageCircle /> WhatsApp
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Destacado</Badge>
          <Badge variant="secondary">Facial</Badge>
          <Badge variant="success">Confirmada</Badge>
          <Badge variant="destructive">Cancelada</Badge>
          <Badge variant="muted">Completada</Badge>
          <Badge variant="warning">No asistió</Badge>
        </div>
        <div className="max-w-sm space-y-2">
          <Label htmlFor="demo">Nombre completo</Label>
          <Input id="demo" placeholder="Ej.: María Fernández" />
        </div>
        <ul className="space-y-1 text-sm">
          <li>Precio: {formatPrice(1800)} · {formatPrice(100)} · {formatPrice(null)}</li>
          <li>Duración: {formatDuration(45)} · {formatDuration(90)}</li>
          <li>Fecha (hora de Bolivia): {formatDateTime("2026-11-10T19:30:00Z")}</li>
        </ul>
      </section>
    </main>
  );
}
