import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";
import { getSettings } from "@/lib/data/public";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Política de privacidad",
  alternates: { canonical: "/privacidad" },
};

export default async function PrivacyPage() {
  const { content } = await getSettings();
  return <LegalPage title="Política de privacidad" text={content.legal.privacy} />;
}
