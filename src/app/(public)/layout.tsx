import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { WhatsAppFloat } from "@/components/public/whatsapp-float";
import { getSettings } from "@/lib/data/public";
import { whatsappLink } from "@/lib/whatsapp";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const { business } = await getSettings();
  const wa = business.whatsapp
    ? whatsappLink(business.whatsapp, "Hola, quisiera hacer una consulta.")
    : null;
  return (
    <>
      <SiteHeader whatsappUrl={wa} />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter business={business} />
      {wa && <WhatsAppFloat href={wa} />}
    </>
  );
}
