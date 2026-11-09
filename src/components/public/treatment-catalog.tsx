"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Category, TreatmentWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TreatmentCard } from "./treatment-card";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function TreatmentCatalog({
  categories,
  treatments,
}: {
  categories: Category[];
  treatments: TreatmentWithRelations[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("categoria") ?? "todas");
  const [query, setQuery] = useState("");

  const usedCategories = categories.filter((c) => treatments.some((t) => t.category.id === c.id));

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return treatments.filter(
      (t) =>
        (category === "todas" || t.category.slug === category) &&
        (!q || normalize(`${t.name} ${t.short_description} ${t.category.name}`).includes(q)),
    );
  }, [treatments, category, query]);

  function selectCategory(slug: string) {
    setCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "todas") params.delete("categoria");
    else params.set("categoria", slug);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div
          role="tablist"
          aria-label="Filtrar por categoría"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
        >
          {[{ slug: "todas", name: "Todos" }, ...usedCategories].map((c) => (
            <button
              key={c.slug}
              role="tab"
              aria-selected={category === c.slug}
              onClick={() => selectCategory(c.slug)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                category === c.slug
                  ? "border-brand-900 bg-brand-900 text-white"
                  : "border-brand-200 bg-white text-brand-900 hover:bg-brand-50",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tratamiento…"
            aria-label="Buscar tratamiento"
            className="rounded-full pl-10"
          />
        </div>
      </div>

      <p className="text-sm text-ink-500" aria-live="polite">
        {filtered.length === 1 ? "1 tratamiento" : `${filtered.length} tratamientos`}
      </p>

      {filtered.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <li key={t.id} className="animate-fade-up">
              <TreatmentCard treatment={t} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-brand-50/50 px-6 py-16 text-center">
          <SearchX className="size-10 text-brand-300" />
          <p className="font-medium text-brand-900">No encontramos tratamientos con ese criterio</p>
          <p className="text-sm text-ink-500">Probá con otra palabra o mirá todas las categorías.</p>
          <Button
            variant="outline"
            onClick={() => {
              setQuery("");
              selectCategory("todas");
            }}
          >
            Ver todos
          </Button>
        </div>
      )}
    </div>
  );
}
