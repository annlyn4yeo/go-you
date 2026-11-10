import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDayLabel, formatIn, formatTime, safeTimeZone, TZ_COOKIE } from "@/lib/time";
import { durationMinutes, exerciseName } from "@/lib/lift";

export const metadata: Metadata = { title: "Log" };

const PAGE = 30;

export default async function LogPage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  const [session, jar, { before }] = await Promise.all([getServerSession(authOptions), cookies(), searchParams]);
  const tz = safeTimeZone(jar.get(TZ_COOKIE)?.value);
  const cursor = before && !Number.isNaN(Date.parse(before)) ? new Date(before) : null;

  const rows = await prisma.workout.findMany({
    where: { userId: session!.user.id, ...(cursor ? { startedAt: { lt: cursor } } : {}) },
    orderBy: { startedAt: "desc" },
    take: PAGE + 1,
    relationLoadStrategy: "join",
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      exercises: { orderBy: { order: "asc" }, select: { exerciseId: true, _count: { select: { sets: true } } } },
    },
  });
  const workouts = rows.slice(0, PAGE);
  const older = rows.length > PAGE ? workouts[PAGE - 1].startedAt.toISOString() : null;

  // Group rows under month headings in the user's zone.
  const months = new Map<string, typeof workouts>();
  for (const w of workouts) {
    const key = formatIn(w.startedAt, tz, { month: "long", year: "numeric" }, "en-GB").toUpperCase();
    months.set(key, [...(months.get(key) ?? []), w]);
  }

  return (
    <section className="space-y-6">
      <h1 className="display text-5xl">Log</h1>

      {workouts.length === 0 && <p className="text-sm text-[var(--muted)]">No workouts logged yet. Finish one on Train and it shows up here.</p>}

      {[...months].map(([month, items]) => (
        <section key={month} aria-label={month}>
          <h2 className="label sticky top-0 z-10 bg-[var(--bg)] py-2">{month}</h2>
          <ul className="border-b border-[var(--divider)]">
            {items.map((w) => {
              const sets = w.exercises.reduce((n, e) => n + e._count.sets, 0);
              const mins = w.endedAt && durationMinutes(w.startedAt.getTime(), w.endedAt.getTime());
              return (
                <li key={w.id} className="border-t border-[var(--divider)]">
                  <Link href={`/app/log/${w.id}`} className="press block py-3">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-base font-bold tracking-[-0.01em]">{formatDayLabel(w.startedAt, tz)}</span>
                      <span className="text-xs font-semibold text-[var(--muted)] tabular">{formatTime(w.startedAt, tz)}</span>
                    </span>
                    <span className="label mt-1 block">
                      {w.exercises.length} EX · {sets} {sets === 1 ? "SET" : "SETS"}
                      {mins ? ` · ${mins} MIN` : ""}
                    </span>
                    <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                      {w.exercises.map((e) => exerciseName(e.exerciseId)).join(" / ")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

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
