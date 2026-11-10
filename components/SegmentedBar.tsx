// One segment per unit when they fit (up to 21, the template unlock); a plain bar beyond that.
export default function SegmentedBar({ count, target, label }: { count: number; target: number; label?: string }) {
  const done = Math.min(count, target);
  const name = label ?? `${done} of ${target}`;
  if (target > 21) {
    return (
      <div role="img" aria-label={name} className="h-2 bg-[var(--divider)]">
        <div className="h-full bg-[var(--fg)]" style={{ width: `${(done / target) * 100}%` }} />
      </div>
    );
  }
  return (
    <div role="img" aria-label={name} className="flex h-2 gap-[2px]">
      {Array.from({ length: target }, (_, i) => (
        <span key={i} className={`flex-1 ${i < done ? "bg-[var(--fg)]" : "bg-[var(--divider)]"}`} />
      ))}
    </div>
  );
}
