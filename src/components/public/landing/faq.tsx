import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Faq as FaqType } from "@/lib/types";
import type { SiteContent } from "@/lib/validation/settings";
import { SectionHeader } from "../section-header";

export function Faq({ header, faqs }: { header: SiteContent["faq"]; faqs: FaqType[] }) {
  if (faqs.length === 0) return null;
  return (
    <section id="preguntas" className="section scroll-mt-20">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <SectionHeader {...header} align="left" />
        <Accordion type="single" collapsible className="rounded-2xl border bg-white px-5 sm:px-7">
          {faqs.map((f) => (
            <AccordionItem key={f.id} value={f.id}>
              <AccordionTrigger>{f.question}</AccordionTrigger>
              <AccordionContent>{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
