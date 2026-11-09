import { SimpleMarkdown } from "./simple-markdown";

export function LegalPage({ title, text }: { title: string; text: string }) {
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <p className="eyebrow">Información legal</p>
      <h1 className="mt-2 mb-8 text-4xl font-semibold sm:text-5xl">{title}</h1>
      {text ? (
        <SimpleMarkdown text={text} />
      ) : (
        <p className="text-ink-500">Contenido en preparación.</p>
      )}
    </div>
  );
}
