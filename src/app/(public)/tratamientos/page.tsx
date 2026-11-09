import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionHeader } from "@/components/public/section-header";
import { TreatmentCatalog } from "@/components/public/treatment-catalog";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategories, getTreatments } from "@/lib/data/public";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Tratamientos",
  description:
    "Catálogo de tratamientos faciales, corporales e inyectables con precios en bolivianos. Reservá tu cita online.",
  alternates: { canonical: "/tratamientos" },
};

export default async function TreatmentsPage() {
  const [categories, treatments] = await Promise.all([getCategories(), getTreatments()]);
  return (
    <div className="bg-gradient-to-b from-brand-50 to-white to-[22rem]">
      <div className="container-page space-y-10 py-12 sm:py-16">
        <SectionHeader
          as="h1"
          eyebrow="Catálogo"
          title="Nuestros tratamientos"
          subtitle="Precios referenciales en bolivianos. Cada tratamiento se ajusta a tu piel y tus objetivos en la valoración."
        />
        <Suspense fallback={<CatalogSkeleton />}>
          <TreatmentCatalog categories={categories} treatments={treatments} />
        </Suspense>
      </div>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-96 rounded-2xl" />
      ))}
    </div>
  );
}
