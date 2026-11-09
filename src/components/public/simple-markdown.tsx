import { cn } from "@/lib/utils";

/**
 * Renderiza texto simple escrito en el panel:
 *   "## Título", listas con "- ", párrafos separados por línea en blanco.
 * No interpreta HTML (seguro contra inyección).
 */
export function SimpleMarkdown({ text, className }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className={cn("space-y-4 leading-relaxed text-ink-600", className)}>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (block.startsWith("## ")) {
          const [heading, ...rest] = lines;
          return (
            <div key={i} className="space-y-3 pt-2">
              <h2 className="text-2xl font-semibold">{heading.slice(3)}</h2>
              {rest.length > 0 && <SimpleMarkdown text={rest.join("\n")} />}
            </div>
          );
        }
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-brand-400">
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {block}
          </p>
        );
      })}
    </div>
  );
}
