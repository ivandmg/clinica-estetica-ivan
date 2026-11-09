import { About } from "@/components/public/landing/about";
import { CtaBand } from "@/components/public/landing/cta-band";
import { Faq } from "@/components/public/landing/faq";
import { FeaturedTreatments } from "@/components/public/landing/featured-treatments";
import { Hero } from "@/components/public/landing/hero";
import { HowToBook } from "@/components/public/landing/how-to-book";
import { Location } from "@/components/public/landing/location";
import { Team } from "@/components/public/landing/team";
import { Testimonials } from "@/components/public/landing/testimonials";
import { WhyUs } from "@/components/public/landing/why-us";
import { JsonLd } from "@/components/public/json-ld";
import {
  getFaqs,
  getFeaturedTreatments,
  getProfessionals,
  getSettings,
  getTestimonials,
} from "@/lib/data/public";
import { clinicJsonLd, faqJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export default async function HomePage() {
  const [{ business, content }, featured, professionals, testimonials, faqs] = await Promise.all([
    getSettings(),
    getFeaturedTreatments(6),
    getProfessionals(),
    getTestimonials(),
    getFaqs(),
  ]);

  return (
    <>
      <JsonLd data={[clinicJsonLd(business, professionals), faqJsonLd(faqs)]} />
      <Hero hero={content.hero} />
      <About about={content.about} />
      <FeaturedTreatments header={content.treatments} treatments={featured} />
      <Team header={content.team} professionals={professionals} />
      <WhyUs whyUs={content.why_us} />
      <HowToBook howTo={content.how_to_book} />
      <Testimonials header={content.testimonials} testimonials={testimonials} />
      <Faq header={content.faq} faqs={faqs} />
      <Location header={content.location} business={business} />
      <CtaBand cta={content.cta} />
    </>
  );
}
