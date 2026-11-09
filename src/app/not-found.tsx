import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/public/status-page";

export default function NotFound() {
  return (
    <StatusPage
      code="Error 404"
      title="Página no encontrada"
      text="La página que buscás no existe o fue movida. Te invitamos a volver al inicio o ver nuestros tratamientos."
    >
      <Button asChild>
        <Link href="/">Ir al inicio</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/tratamientos">Ver tratamientos</Link>
      </Button>
    </StatusPage>
  );
}
