import Link from "next/link";
import { LogoIcon } from "@/components/brand/logo";

export function StatusPage({
  code,
  title,
  text,
  children,
}: {
  code?: string;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <Link href="/" aria-label="Ir al inicio">
        <LogoIcon className="size-14" />
      </Link>
      {code && <p className="eyebrow">{code}</p>}
      <h1 className="text-4xl font-semibold sm:text-5xl">{title}</h1>
      <p className="max-w-md text-ink-500">{text}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">{children}</div>
    </div>
  );
}
