"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/public/status-page";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StatusPage
      code="Ups"
      title="Algo salió mal"
      text="No pudimos cargar esta página. Probá de nuevo en unos segundos; si el problema sigue, escribinos por WhatsApp."
    >
      <Button onClick={reset}>Reintentar</Button>
      <Button asChild variant="outline">
        <Link href="/">Ir al inicio</Link>
      </Button>
    </StatusPage>
  );
}
