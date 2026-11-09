import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TreatmentWithRelations } from "@/lib/types";
import { formatDuration, formatPrice } from "@/lib/format";
import { SmartImage } from "./smart-image";

export function TreatmentCard({ treatment }: { treatment: TreatmentWithRelations }) {
  return (
    <Link
      href={`/tratamientos/${treatment.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_18px_40px_-20px_rgba(15,46,82,0.35)] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-50 sm:aspect-[4/3]">
        <SmartImage
          src={treatment.image_url}
          alt={treatment.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <Badge variant="secondary" className="absolute top-3 left-3 bg-white/90 backdrop-blur">
          {treatment.category.name}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-serif text-xl leading-snug font-semibold text-brand-900 sm:text-2xl">
          {treatment.name}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-500">
          {treatment.short_description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-brand-900">
              {formatPrice(treatment.price)}
            </span>
            <span className="flex items-center gap-1 text-xs text-ink-500">
              <Clock className="size-3.5" /> {formatDuration(treatment.duration_minutes)}
            </span>
          </div>
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-800 transition-colors group-hover:bg-brand-900 group-hover:text-white">
            <ArrowRight className="size-4" />
            <span className="sr-only">Ver detalle</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
