import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TreatmentWithRelations } from "@/lib/types";
import type { SiteContent } from "@/lib/validation/settings";
import { Reveal } from "../reveal";
import { SectionHeader } from "../section-header";
import { TreatmentCard } from "../treatment-card";

export function FeaturedTreatments({
  header,
  treatments,
}: {
  header: SiteContent["treatments"];
  treatments: TreatmentWithRelations[];
}) {
  if (treatments.length === 0) return null;
  return (
    <section className="section bg-brand-50/70">
      <div className="container-page space-y-12">
        <SectionHeader {...header} />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {treatments.map((t, i) => (
            <Reveal as="li" key={t.id} delay={(i % 3) * 80}>
              <TreatmentCard treatment={t} />
            </Reveal>
          ))}
        </ul>
        <div className="text-center">
          <Button asChild size="lg" variant="outline">
            <Link href="/tratamientos">
              Ver todos los tratamientos <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
