import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

// Página temporal: la landing completa se construye en la Fase 2.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-brand-50 p-8 text-center">
      <Logo />
      <h1 className="text-4xl font-semibold">Sitio en construcción</h1>
      <Button asChild>
        <Link href="/marca">Ver identidad visual</Link>
      </Button>
    </main>
  );
}
