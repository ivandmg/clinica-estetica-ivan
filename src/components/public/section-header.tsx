import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div
      className={cn(
        "max-w-2xl space-y-3",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Heading className="text-3xl leading-tight font-semibold sm:text-4xl lg:text-[2.75rem]">
        {title}
      </Heading>
      {subtitle && <p className="text-base leading-relaxed text-ink-500 sm:text-lg">{subtitle}</p>}
    </div>
  );
}
