export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bestE1rmByExercise } from "@/lib/history";
import { formatDayLabel, formatIn, formatTime, safeTimeZone, TZ_COOKIE } from "@/lib/time";
import { durationMinutes, e1rmKg, exerciseName, formatLoad, formatNumber, prFlags, toKg } from "@/lib/lift";
import StatGrid from "@/components/StatGrid";

export const metadata: Metadata = { title: "Workout" };

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session, jar] = await Promise.all([params, getServerSession(authOptions), cookies()]);
  const userId = session!.user.id;
  const tz = safeTimeZone(jar.get(TZ_COOKIE)?.value);

  const workout = await prisma.workout.findFirst({
    where: { id, userId },
    relationLoadStrategy: "join",
    include: { exercises: { orderBy: { order: "asc" }, include: { sets: { orderBy: { createdAt: "asc" } } } } },
  });
  if (!workout) notFound();

  // Bests from earlier workouts, so this workout's PR sets can be marked.
  const bestBefore = await bestE1rmByExercise(userId, workout.startedAt);
  const exercises = workout.exercises.filter((e) => e.sets.length > 0);
  const sets = exercises.flatMap((e) => e.sets);
  const volumeKg = sets.reduce((n, s) => n + toKg(s.weight, s.unit) * s.reps, 0);
  const mins = workout.endedAt && durationMinutes(workout.startedAt.getTime(), workout.endedAt.getTime());
  const year = formatIn(workout.startedAt, tz, { year: "numeric" }, "en-GB");

  return (
    <section className="space-y-8">
      <Link href="/app/log" className="press label inline-flex min-h-[var(--tap)] items-center text-[var(--fg)]">
        ← Log
      </Link>

      <header className="space-y-2">
        <p className="label">
          {formatDayLabel(workout.startedAt, tz)} {year} · {formatTime(workout.startedAt, tz)}
        </p>
        <h1 className="display text-5xl">Workout</h1>
      </header>

      <StatGrid
        items={[
          ["Time", mins ? `${mins}M` : "—"],
          ["Sets", String(sets.length)],
          ["Vol kg", formatNumber(Math.round(volumeKg))],
        ]}
      />

      {exercises.map((exercise) => {
        const prs = prFlags(exercise.sets, bestBefore[exercise.exerciseId]);
        const topE1rm = Math.max(...exercise.sets.map((s) => e1rmKg(s.weight, s.reps, s.unit)));
        return (
          <article key={exercise.id} className="space-y-3">
            <header className="flex items-baseline justify-between gap-3 border-t-2 border-[var(--fg)] pt-3">
              <h2 className="text-xl font-bold uppercase leading-tight tracking-[-0.01em]">{exerciseName(exercise.exerciseId)}</h2>
              <p className="label shrink-0">e1RM {formatNumber(topE1rm)} kg</p>
            </header>
            <ol className="border-b border-[var(--divider)]">
              {exercise.sets.map((s, i) => (
                <li
                  key={s.id}
                  className={`grid h-11 grid-cols-[2rem_1fr] items-center border-t border-[var(--divider)] ${prs[i] ? "bg-[var(--fg)] text-[var(--bg)]" : ""}`}
                >
                  <span className={`pl-1 text-xs font-semibold tabular ${prs[i] ? "" : "text-[var(--muted)]"}`}>{i + 1}</span>
                  <span className="flex items-center gap-3 text-base font-semibold tabular">
                    {s.reps} × {formatLoad(s.weight, s.unit)}
                    {prs[i] && <span className="tag">PR</span>}
                  </span>
                </li>
              ))}
            </ol>
          </article>
        );
      })}
    </section>
  );
}
