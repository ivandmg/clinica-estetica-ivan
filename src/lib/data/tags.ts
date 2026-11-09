/**
 * Etiquetas de caché del contenido público. Cuando el manager edita algo en el
 * panel, se invalida la etiqueta correspondiente y el sitio se actualiza.
 */
export const CACHE_TAGS = {
  settings: "settings",
  catalog: "catalog", // categorías + tratamientos + asignaciones
  team: "team", // profesionales
  content: "content", // testimonios + FAQ
} as const;

/** Segundos que el contenido público puede servirse desde caché sin consultar la base. */
export const PUBLIC_REVALIDATE_SECONDS = 3600;
