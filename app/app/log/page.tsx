import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBoard, getExerciseNames } from "@/lib/history";
import { dayIn, formatIn, formatTime, safeTimeZone, TZ_COOKIE } from "@/lib/time";
import { durationMinutes, exerciseName } from "@/lib/lift";
import { workoutName } from "@/lib/workout-name";

export const metadata: Metadata = { title: "Log" };

const PAGE = 30;

export default async function LogPage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  const [session, jar, { before }] = await Promise.all([getServerSession(authOptions), cookies(), searchParams]);
  const userId = session!.user.id;
  const tz = safeTimeZone(jar.get(TZ_COOKIE)?.value);
  const cursor = before && !Number.isNaN(Date.parse(before)) ? new Date(before) : null;

  const [rows, names, { prsByWorkout, startedAt }] = await Promise.all([
    prisma.workout.findMany({
      where: { userId, ...(cursor ? { startedAt: { lt: cursor } } : {}) },
      orderBy: { startedAt: "desc" },
      take: PAGE + 1,
      relationLoadStrategy: "join",
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
        title: true,
        exercises: { orderBy: { order: "asc" }, select: { exerciseId: true, _count: { select: { sets: true } } } },
      },
    }),
    getExerciseNames(userId),
    getBoard(userId), // cached with Stats: PR sets per workout, and every workout's start for the month tapes
  ]);
  const workouts = rows.slice(0, PAGE);
  const older = rows.length > PAGE ? workouts[PAGE - 1].startedAt.toISOString() : null;

  const day = dayIn(tz);
  const today = day(new Date());
  const tape = new Map<string, Map<string, number>>(); // month "YYYY-MM" → trained day → PR sets that day
  // shortcut: workouts with no exercises never reach the board, so they leave no bar; harmless (nothing was trained).
  for (const [id, iso] of Object.entries(startedAt)) {
    const d = day(new Date(iso));
    const m = tape.get(d.slice(0, 7)) ?? tape.set(d.slice(0, 7), new Map()).get(d.slice(0, 7))!;
    m.set(d, (m.get(d) ?? 0) + (prsByWorkout[id] ?? 0));
  }

  // Month → day → that day's workouts, newest first, in the user's zone.
  const months = new Map<string, Map<string, typeof workouts>>();
  for (const w of workouts) {
    const d = day(w.startedAt);
    const m = months.get(d.slice(0, 7)) ?? months.set(d.slice(0, 7), new Map()).get(d.slice(0, 7))!;
    m.set(d, [...(m.get(d) ?? []), w]);
  }

  return (
    <section className="space-y-6">
      <h1 className="display text-5xl">Log</h1>

      {workouts.length === 0 && <p className="text-sm text-[var(--muted)]">No workouts logged yet. Finish one on Train and it shows up here.</p>}

      {[...months].map(([month, days]) => {
        const first = new Date(`${month}-15T12:00:00Z`);
        const title = formatIn(first, "UTC", { month: "long", ...(month.slice(0, 4) !== today.slice(0, 4) && { year: "numeric" }) }, "en-GB").toUpperCase();
        const trained = tape.get(month) ?? new Map<string, number>();
        const records = [...trained.values()].reduce((n, r) => n + r, 0);
        const length = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0)).getUTCDate();
        return (
          <section key={month} aria-label={title}>
            <h2 className="sticky top-0 z-10 flex items-baseline justify-between gap-3 bg-[var(--bg)] py-3">
              <span className="text-[13px] font-bold tracking-[0.16em]">{title}</span>
              <span className="text-[13px] text-[var(--muted)] tabular">
                {trained.size} {trained.size === 1 ? "day" : "days"}
                {records > 0 && ` · ${records} ${records === 1 ? "record" : "records"}`}
              </span>
            </h2>

            {/* The month tape (DD-058): a bar per day. Short = trained, full = set a record, outline = today, hairline = rest. */}
            <div
              role="img"
              aria-label={`${title}: trained on ${trained.size} days, records on ${[...trained.values()].filter((r) => r > 0).length}`}
              className="grid h-[34px] items-end gap-[2px]"
              style={{ gridTemplateColumns: `repeat(${length}, 1fr)` }}
            >
              {Array.from({ length }, (_, i) => {
                const d = `${month}-${String(i + 1).padStart(2, "0")}`;
                const prs = trained.get(d);
                const cls =
                  prs === undefined
                    ? d === today
                      ? "h-5 shadow-[inset_0_0_0_1px_var(--fg)]"
                      : d > today
                        ? "h-px bg-[var(--divider)]"
                        : "h-0.5 bg-[#cfcfcf]"
                    : prs > 0
                      ? "h-full bg-[var(--fg)]"
                      : "h-5 bg-[var(--fg)]";
                return <span key={d} className={cls} />;
              })}
            </div>
            <div aria-hidden="true" className="mt-1.5 grid gap-[2px] text-[10px] font-semibold text-[var(--muted)] tabular" style={{ gridTemplateColumns: `repeat(${length}, 1fr)` }}>
              {[1, 8, 15, 22, 29].filter((n) => n <= length).map((n) => (
                <span key={n} className="whitespace-nowrap" style={{ gridColumn: n }}>
                  {n}
                </span>
              ))}
            </div>
            <p aria-hidden="true" className="mt-2 flex gap-4 text-[11px] text-[var(--muted)]">
              <span className="flex items-end gap-1.5"><span className="inline-block h-2 w-1.5 bg-[var(--fg)]" />Trained</span>
              <span className="flex items-end gap-1.5"><span className="inline-block h-3 w-1.5 bg-[var(--fg)]" />Record</span>
            </p>

            {/* The ledger: the date once per day, that day's workouts beside it. */}
            <ul className="mt-4 border-b border-[var(--divider)]">
              {[...days].map(([d, list]) => (
                <li key={d} className="grid grid-cols-[3.25rem_1fr] border-t border-[var(--divider)] py-3.5">
                  <span aria-hidden="true">
                    <span className="block text-[30px] font-bold leading-[0.9] tracking-[-0.03em] tabular">{+d.slice(8)}</span>
                    <span className="label mt-1.5 block text-[11px]">{formatIn(list[0].startedAt, tz, { weekday: "short" }, "en-GB")}</span>
                  </span>
                  <span className="space-y-3.5">
                    {list.map((w) => {
                      const sets = w.exercises.reduce((n, e) => n + e._count.sets, 0);
                      const mins = w.endedAt && durationMinutes(w.startedAt.getTime(), w.endedAt.getTime());
                      const prs = prsByWorkout[w.id] ?? 0;
                      const time = formatTime(w.startedAt, tz);
                      const exercises = w.exercises
                        .filter((e) => e._count.sets > 0)
                        .map((e) => ({ id: e.exerciseId, name: exerciseName(e.exerciseId, names[e.exerciseId]), sets: e._count.sets }));
                      const title = workoutName(+time.slice(0, 2), exercises, w.title); // the lifter's own type first (DD-062)
                      return (
                        <Link key={w.id} href={`/app/log/${w.id}`} className="press grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-1">
                          <span className="min-w-0 text-base font-bold uppercase leading-snug tracking-[-0.01em] [overflow-wrap:anywhere]">
                            <span className="sr-only">{formatIn(w.startedAt, tz, { weekday: "long", day: "numeric", month: "long" }, "en-GB")}: </span>
                            {title.name}
                          </span>
                          {prs > 0 ? <span className="tag mt-0.5 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]">{prs} PR</span> : <span />}
                          {/* The name only says "workout" when it can't tell what was trained: then the exercises say it (DD-061). */}
                          {!title.known && exercises.length > 0 && (
                            <span className="col-span-2 truncate text-[13px]">{exercises.map((e) => e.name).join(", ")}</span>
                          )}
                          <span className="text-[13px] text-[var(--muted)] tabular">
                            {time} · {sets} {sets === 1 ? "set" : "sets"}
                            {mins ? ` · ${mins} min` : ""}
                          </span>
                        </Link>
                      );
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {(older || cursor) && (
        <nav aria-label="Pages" className="grid grid-cols-2 gap-3">
          {cursor ? (
            <Link href="/app/log" className="btn">
              ← Newest
            </Link>
          ) : (
            <span />
          )}
          {older && (
            <Link href={`/app/log?before=${encodeURIComponent(older)}`} className="btn">
              Older →
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}
