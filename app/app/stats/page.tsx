import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeTimeZone, TZ_COOKIE } from "@/lib/time";
import { fromKg, getStats, resolveRange, resolveUnit, type Range, type Unit } from "@/lib/stats";

function formatExerciseName(exerciseId: string) {
  return exerciseId.replace(/_/g, " ").toUpperCase();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: value >= 1000 ? 0 : 1,
  }).format(value);
}

function formatMinutes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0m";
  const rounded = Math.round(value);
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Week keys are "YYYY-MM-DD"; format them without shifting time zones.
const formatDay = (day: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, { ...opts, timeZone: "UTC" });

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "7d", label: "LAST 7 DAYS" },
  { value: "30d", label: "LAST 30 DAYS" },
  { value: "90d", label: "LAST 90 DAYS" },
  { value: "all", label: "ALL TIME" },
];

const href = (range: Range, unit: Unit) => `/app/stats?range=${range}&unit=${unit}`;

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; unit?: string }>;
}) {
  const [session, jar, params] = await Promise.all([getServerSession(authOptions), cookies(), searchParams]);
  const range = resolveRange(params.range);
  const unit = resolveUnit(params.unit);
  const data = await getStats(session!.user.id, range, safeTimeZone(jar.get(TZ_COOKIE)?.value));
  const u = (kg: number) => fromKg(kg, unit);
  const maxTrendVolume = Math.max(0, ...data.volumeTrend.map((e) => e.volumeKg));

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">STATS</h1>
        <div className="text-sm text-[var(--muted)]">
          PERFORMANCE SIGNALS, PRs, AND TRAINING DENSITY
        </div>
      </header>

      <section className="border-t border-[var(--divider)] pt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => {
            const active = range === option.value;
            return (
              <Link
                key={option.value}
                href={href(option.value, unit)}
                replace
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={`border px-3 py-1.5 text-xs font-semibold tracking-wide ${
                  active
                    ? "border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]"
                    : "border-[var(--divider)] text-[var(--muted)]"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--muted)] tracking-wide">DISPLAY UNIT</span>
          <div className="border border-[var(--divider)] flex">
            {(["kg", "lb"] as const).map((option, i) => (
              <Link
                key={option}
                href={href(range, option)}
                replace
                scroll={false}
                aria-current={unit === option ? "page" : undefined}
                className={`${i ? "border-l border-[var(--divider)] " : ""}px-3 py-1.5 font-semibold ${
                  unit === option ? "bg-[var(--fg)] text-[var(--bg)]" : "text-[var(--muted)]"
                }`}
              >
                {option.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard label="WORKOUTS" value={String(data.kpis.workoutsCount)} hint="COMPLETED OR IN RANGE" />
        <KpiCard
          label={`TOTAL VOLUME (${unit.toUpperCase()})`}
          value={formatNumber(u(data.kpis.totalVolumeKg))}
          hint="SUM OF REPS x LOAD"
        />
        <KpiCard label="AVG SESSION" value={formatMinutes(data.kpis.avgSessionLengthMinutes)} hint="FROM START TO END" />
      </section>

      {data.kpis.workoutsCount === 0 ? (
        <section className="border-t border-[var(--divider)] pt-6 text-sm text-[var(--muted)]">
          NO WORKOUTS FOUND FOR THIS RANGE.
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="border-t border-[var(--divider)] pt-4 space-y-4">
            <div className="text-sm font-semibold tracking-wide">VOLUME / WEEK</div>

            <div className="grid grid-cols-1 gap-2">
              {data.volumeTrend.map((entry) => {
                const ratio = maxTrendVolume > 0 ? Math.max(2, (entry.volumeKg / maxTrendVolume) * 100) : 0;

                return (
                  <div key={entry.weekStart} className="grid grid-cols-[110px_1fr_auto] gap-3 items-center">
                    <div className="text-xs text-[var(--muted)]">
                      {formatDay(entry.weekStart, { month: "short", day: "numeric" })}
                    </div>
                    <div className="h-6 border border-[var(--divider)] relative">
                      <div className="absolute left-0 top-0 h-full bg-[var(--fg)]" style={{ width: `${ratio}%` }} />
                    </div>
                    <div className="text-xs font-medium tabular-nums min-w-[70px] text-right">
                      {formatNumber(u(entry.volumeKg))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="border-t border-[var(--divider)] pt-4 space-y-3">
            <div className="text-sm font-semibold tracking-wide">TOP EXERCISES</div>
            <div className="border border-[var(--divider)] divide-y divide-[var(--divider)] text-sm">
              {data.topExercises.map((exercise) => (
                <div key={exercise.exerciseId} className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 items-center">
                  <div>
                    <div className="font-medium">{formatExerciseName(exercise.exerciseId)}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {exercise.setCount} sets in {exercise.workoutCount} workouts
                    </div>
                  </div>
                  <div className="text-xs text-[var(--muted)] text-right">
                    best wt
                    <br />
                    <span className="text-[var(--fg)] font-medium tabular-nums">{formatNumber(u(exercise.bestWeightKg))}</span>
                  </div>
                  <div className="text-xs text-[var(--muted)] text-right">
                    best 1rm
                    <br />
                    <span className="text-[var(--fg)] font-medium tabular-nums">{formatNumber(u(exercise.best1rmKg))}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="xl:col-span-2 border-t border-[var(--divider)] pt-4 space-y-3">
            <div className="text-sm font-semibold tracking-wide">RECENT PR EVENTS</div>

            {data.recentPrs.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">No PRs recorded in this range.</div>
            ) : (
              <div className="border border-[var(--divider)] divide-y divide-[var(--divider)]">
                {data.recentPrs.map((pr) => (
                  <div
                    key={pr.setId}
                    className="grid grid-cols-1 gap-2 px-3 py-2 text-sm md:grid-cols-[170px_1fr_auto_auto] md:items-center"
                  >
                    <div className="text-xs text-[var(--muted)]">
                      {new Date(pr.occurredAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        timeZone: safeTimeZone(jar.get(TZ_COOKIE)?.value),
                      })}
                    </div>
                    <div className="font-medium">{formatExerciseName(pr.exerciseId)}</div>
                    <div className="text-xs text-[var(--muted)] tabular-nums">
                      {pr.reps} x {formatNumber(u(pr.weightKg))} {unit}
                    </div>
                    <div className="text-xs font-semibold tabular-nums text-right">
                      +{formatNumber(u(pr.e1rmKg - pr.prevKg))} 1RM
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="border border-[var(--divider)] p-4 space-y-2">
      <div className="text-xs tracking-wide text-[var(--muted)]">{label}</div>
      <div className="text-3xl font-bold leading-none tabular-nums">{value}</div>
      <div className="text-xs text-[var(--muted)]">{hint}</div>
    </article>
  );
}
