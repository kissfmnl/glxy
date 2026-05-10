/** Servertje: HTML-alinea’s voor admin-koppen (alleen door super-admin bewerkbaar). */
export function AdminIntroHtml({ html }: { html: string }) {
  return (
    <div
      className="max-w-none text-sm leading-relaxed text-[var(--text-muted)] [&_a]:font-semibold [&_a]:text-[var(--brand-yellow)] [&_a]:underline-offset-2 [&_a]:hover:underline"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
