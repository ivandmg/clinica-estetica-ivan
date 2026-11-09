import { useId } from "react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/config/site";

/**
 * ⭐ LOGO DE LA MARCA
 * Para usar otro logo: reemplazá los `path` de <LogoIcon> (y los SVG de /public/brand).
 * El texto del logo horizontal se toma de `siteConfig.logoTop` y `siteConfig.logoBottom`.
 */
const DROP = "M32 4C32 4 52 23.5 52 39a20 20 0 0 1-40 0C12 23.5 32 4 32 4Z";
const LEAF = "M32 21.5c8.6 6.2 9.6 19.3 0 30.5-9.6-11.2-8.6-24.3 0-30.5Z";
const RIB = "M32 27v20.5M32 34.5l-3.6-3.2M32 40.5l3.6-3.2";

type Tone = "color" | "white";

export function LogoIcon({
  tone = "color",
  className,
  title,
}: {
  tone?: Tone;
  className?: string;
  title?: string;
}) {
  const gradientId = useId();
  const white = tone === "white";
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-10 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {!white && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="14"
            y1="6"
            x2="50"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="var(--color-brand-500)" />
            <stop offset="1" stopColor="var(--color-brand-900)" />
          </linearGradient>
        </defs>
      )}
      <path d={DROP} fill={white ? "#fff" : `url(#${gradientId})`} />
      <path d={LEAF} fill={white ? "var(--color-brand-900)" : "#fff"} />
      <path
        d={RIB}
        fill="none"
        stroke={white ? "#fff" : "var(--color-brand-700)"}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  tone = "color",
  variant = "horizontal",
  className,
}: {
  tone?: Tone;
  variant?: "horizontal" | "icon";
  className?: string;
}) {
  if (variant === "icon") {
    return <LogoIcon tone={tone} className={className} title={siteConfig.name} />;
  }
  const white = tone === "white";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoIcon tone={tone} className="size-9 sm:size-10" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[0.6rem] font-semibold tracking-[0.25em] uppercase sm:text-[0.65rem]",
            white ? "text-brand-200" : "text-brand-500",
          )}
        >
          {siteConfig.logoTop}
        </span>
        <span
          className={cn(
            "font-serif text-2xl font-semibold sm:text-[1.65rem]",
            white ? "text-white" : "text-brand-900",
          )}
        >
          {siteConfig.logoBottom}
        </span>
      </span>
    </span>
  );
}
