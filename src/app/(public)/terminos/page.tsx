import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";
import { getSettings } from "@/lib/data/public";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Términos y condiciones",
  alternates: { canonical: "/terminos" },
};

export default async function TermsPage() {
  const { content } = await getSettings();
  return <LegalPage title="Términos y condiciones" text={content.legal.terms} />;
}
