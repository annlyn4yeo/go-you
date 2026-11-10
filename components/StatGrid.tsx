// Headline numbers on a 1px ruled grid (the gap shows the divider colour through).
export default function StatGrid({ items, size = "text-2xl" }: { items: [label: string, value: string][]; size?: string }) {
  return (
    <dl className="grid auto-cols-fr grid-flow-col gap-px border border-[var(--divider)] bg-[var(--divider)]">
      {items.map(([label, value]) => (
        <div key={label} className="bg-[var(--bg)] p-3">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</dt>
          <dd className={`${size} font-bold tracking-[-0.02em] tabular`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
