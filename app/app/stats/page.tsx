import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatDayMonth, safeTimeZone, TZ_COOKIE } from "@/lib/time";
import { exerciseName, formatLoad, formatNumber, fromKg, type Unit } from "@/lib/lift";
import { getStats, resolveRange, resolveUnit, type Range } from "@/lib/stats";
import StatGrid from "@/components/StatGrid";

export const metadata: Metadata = { title: "Stats" };

function formatMinutes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0M";
  const rounded = Math.round(value);
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return hours ? `${hours}H ${mins}M` : `${mins}M`;
}

// Week keys are "YYYY-MM-DD"; read them as UTC so they don't shift.
const weekLabel = (day: string) => formatDayMonth(new Date(`${day}T12:00:00Z`), "UTC");

const RANGES: { value: Range; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "all", label: "ALL" },
];

const href = (range: Range, unit: Unit) => `/app/stats?range=${range}&unit=${unit}`;

// Segmented control made of links: the server renders each choice from cache.
function Segment({ items, active }: { items: { key: string; label: string; href: string }[]; active: string }) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-px border border-[var(--control)] bg-[var(--control)]">
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          replace
          scroll={false}
          aria-current={i.key === active ? "true" : undefined}
          className={`press flex h-11 items-center justify-center px-2 text-xs font-bold tracking-[0.12em] ${
            i.key === active ? "bg-[var(--fg)] text-[var(--bg)]" : "bg-[var(--bg)]"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ range?: string; unit?: string }> }) {
  const [session, jar, params] = await Promise.all([getServerSession(authOptions), cookies(), searchParams]);
  const range = resolveRange(params.range);
  const unit = resolveUnit(params.unit);
  const tz = safeTimeZone(jar.get(TZ_COOKIE)?.value);
  const data = await getStats(session!.user.id, range, tz);
  const u = (kg: number) => fromKg(kg, unit);
  const maxTrendVolume = Math.max(0, ...data.volumeTrend.map((e) => e.volumeKg));

  return (
    <section className="space-y-10">
      <h1 className="display text-5xl">Stats</h1>

      <div className="grid grid-cols-[1fr_auto] gap-3" aria-label="Filters">
        <Segment active={range} items={RANGES.map((r) => ({ key: r.value, label: r.label, href: href(r.value, unit) }))} />
        <Segment active={unit} items={(["kg", "lb"] as const).map((x) => ({ key: x, label: x.toUpperCase(), href: href(range, x) }))} />
      </div>

      <StatGrid
        items={[
          ["Workouts", String(data.kpis.workoutsCount)],
          [`Volume ${unit}`, formatNumber(Math.round(u(data.kpis.totalVolumeKg)))],
          ["Avg session", formatMinutes(data.kpis.avgSessionLengthMinutes)],
        ]}
      />

      {data.kpis.workoutsCount === 0 ? (
        <p className="text-sm text-[var(--muted)]">No workouts in this range.</p>
      ) : (
        <>
          <section aria-labelledby="prs" className="space-y-3">
            <h2 id="prs" className="label">
              Personal records
            </h2>
            {data.recentPrs.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No PRs in this range.</p>
            ) : (
              <ul className="border-b border-[var(--divider)]">
                {data.recentPrs.map((pr) => (
                  <li key={pr.setId} className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-[var(--divider)] py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-base font-bold tracking-[-0.01em]">{exerciseName(pr.exerciseId)}</span>
                      <span className="label mt-1 block">
                        {formatDayMonth(new Date(pr.occurredAt), tz)} · {pr.reps} × {formatLoad(u(pr.weightKg), unit)}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-lg font-bold tabular">+{formatNumber(u(pr.e1rmKg - pr.prevKg))}</span>
                      <span className="label">e1RM</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="volume" className="space-y-3">
            <h2 id="volume" className="label">
              Volume / week · {unit}
            </h2>
            <ul className="space-y-1.5">
              {data.volumeTrend.map((entry) => (
                <li key={entry.weekStart} className="grid grid-cols-[3.5rem_1fr_4rem] items-center gap-3">
                  <span className="text-xs font-semibold text-[var(--muted)] tabular">{weekLabel(entry.weekStart)}</span>
                  <span className="h-5 bg-[var(--divider)]">
                    <span
                      className="block h-full bg-[var(--fg)]"
                      style={{ width: `${maxTrendVolume > 0 ? Math.max(2, (entry.volumeKg / maxTrendVolume) * 100) : 0}%` }}
                    />
                  </span>
                  <span className="text-right text-xs font-semibold tabular">{formatNumber(Math.round(u(entry.volumeKg)))}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="top" className="space-y-3">
            <h2 id="top" className="label">
              Top exercises
            </h2>
            <ul className="border-b border-[var(--divider)]">
              {data.topExercises.map((ex) => (
                <li key={ex.exerciseId} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t border-[var(--divider)] py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-base font-bold tracking-[-0.01em]">{exerciseName(ex.exerciseId)}</span>
                    <span className="label mt-1 block">
                      {ex.setCount} sets · {ex.workoutCount} workouts
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-base font-bold tabular">{ex.bestWeightKg ? formatNumber(u(ex.bestWeightKg)) : "BW"}</span>
                    <span className="label">Best</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-base font-bold tabular">{ex.best1rmKg ? formatNumber(u(ex.best1rmKg)) : "—"}</span>
                    <span className="label">e1RM</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </section>
  );
}
