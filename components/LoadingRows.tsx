// Route skeleton: the real page title plus ruled placeholder rows. Static on purpose:
// it shows on every tap, so motion would only make waiting feel longer.
const WIDTHS = ["w-2/5", "w-3/5", "w-1/3", "w-1/2"];

export default function LoadingRows({ title, rows = 6 }: { title: string; rows?: number }) {
  return (
    <section className="space-y-6" aria-busy="true">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--muted)]">{title}</h1>
      <p role="status" className="sr-only">
        Loading {title.toLowerCase()}
      </p>
      <ul aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="h-11 border-t border-[var(--divider)] flex items-center">
            <span className={`h-3 bg-[var(--divider)] ${WIDTHS[i % WIDTHS.length]}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}
