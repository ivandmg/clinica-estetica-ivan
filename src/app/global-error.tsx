"use client";

// Último recurso si falla el layout raíz. Sin dependencias para que siempre cargue.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es-BO">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, color: "#0F2E52", textAlign: "center", padding: 16 }}>
        <div>
          <h1>Algo salió mal</h1>
          <p style={{ color: "#64748B" }}>Estamos teniendo un problema. Probá de nuevo en unos segundos.</p>
          <button onClick={reset} style={{ background: "#0F2E52", color: "#fff", border: 0, borderRadius: 999, padding: "10px 20px", cursor: "pointer" }}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
