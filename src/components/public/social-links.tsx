import type { Business } from "@/lib/validation/settings";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "./social-icons";

export function SocialLinks({
  business,
  className,
  tone = "light",
}: {
  business: Business;
  className?: string;
  tone?: "light" | "dark";
}) {
  const items = [
    { href: business.social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: business.social.tiktok, label: "TikTok", Icon: TikTokIcon },
    { href: business.social.facebook, label: "Facebook", Icon: FacebookIcon },
    {
      href: business.whatsapp ? whatsappLink(business.whatsapp) : "",
      label: "WhatsApp",
      Icon: WhatsAppIcon,
    },
  ].filter((i) => i.href);

  return (
    <ul className={cn("flex items-center gap-2", className)}>
      {items.map(({ href, label, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className={cn(
              "flex size-10 items-center justify-center rounded-full transition-colors",
              tone === "dark"
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-brand-50 text-brand-800 hover:bg-brand-100",
            )}
          >
            <Icon className="size-5" />
          </a>
        </li>
      ))}
    </ul>
  );
}
