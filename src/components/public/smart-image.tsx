"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { LogoIcon } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * next/image con respaldo: si la imagen no existe o falla, muestra un fondo
 * con la marca en lugar de un ícono roto. Usar dentro de un contenedor `relative`.
 */
export function SmartImage({
  src,
  alt,
  className,
  fallbackTone = "light",
  ...props
}: Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  /** "dark" para imágenes sobre fondos azules (ej. el hero) */
  fallbackTone?: "light" | "dark";
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex size-full items-center justify-center bg-gradient-to-br",
          fallbackTone === "dark"
            ? "from-brand-700 via-brand-900 to-brand-950"
            : "from-brand-100 via-brand-50 to-white",
          props.fill && "absolute inset-0",
          className,
        )}
      >
        <LogoIcon
          tone={fallbackTone === "dark" ? "white" : "color"}
          className="size-1/4 max-h-20 max-w-20 opacity-20"
        />
      </div>
    );
  }
  return <Image src={src} alt={alt} className={className} onError={() => setFailed(true)} {...props} />;
}
