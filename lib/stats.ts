import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { dayIn, weekStart } from "@/lib/time";

export type Range = "7d" | "30d" | "90d" | "all";
export type Unit = "kg" | "lb";

export const KG_PER_LB = 0.45359237;
export const workoutsTag = (userId: string) => `workouts:${userId}`;

export const resolveRange = (v: string | undefined): Range =>
  v === "7d" || v === "30d" || v === "90d" || v === "all" ? v : "90d";
export const resolveUnit = (v: string | undefined): Unit => (v === "lb" ? "lb" : "kg");
export const fromKg = (kg: number, unit: Unit) => (unit === "lb" ? kg / KG_PER_LB : kg);

const toKg = (weight: number, unit: string) => (unit === "lb" ? weight * KG_PER_LB : weight);
const DAYS: Record<Exclude<Range, "all">, number> = { "7d": 7, "30d": 30, "90d": 90 };

// All values in kg; the page converts to the display unit.
async function computeStats(userId: string, range: Range, tz: string) {
  const since = range === "all" ? null : new Date(Date.now() - DAYS[range] * 86400000);
  const workouts = await prisma.workout.findMany({
    where: { userId, ...(since ? { startedAt: { gte: since } } : {}) },
    orderBy: { startedAt: "asc" },
    relationLoadStrategy: "join",
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      exercises: {
        select: {
          exerciseId: true,
          sets: { orderBy: { createdAt: "asc" }, select: { id: true, reps: true, weight: true, unit: true, createdAt: true } },
        },
      },
    },
  });

  const day = dayIn(tz);
  let totalVolumeKg = 0;
  let totalMinutes = 0;
  let completed = 0;
  const top = new Map<string, { sets: number; workouts: Set<string>; bestWeightKg: number; best1rmKg: number }>();
  const best1rm = new Map<string, number>();
  const weekly = new Map<string, number>();
  const prs: { occurredAt: string; exerciseId: string; setId: string; reps: number; weightKg: number; e1rmKg: number; prevKg: number }[] = [];

  for (const w of workouts) {
    if (w.endedAt) {
      totalMinutes += Math.max(0, (w.endedAt.getTime() - w.startedAt.getTime()) / 60000);
      completed += 1;
    }
    const week = weekStart(day(w.startedAt));
    for (const ex of w.exercises) {
      const t = top.get(ex.exerciseId) ?? { sets: 0, workouts: new Set<string>(), bestWeightKg: 0, best1rmKg: 0 };
      top.set(ex.exerciseId, t);
      t.workouts.add(w.id);
      for (const s of ex.sets) {
        const kg = toKg(s.weight, s.unit);
        const e1rm = kg * (1 + s.reps / 30); // Epley
        totalVolumeKg += kg * s.reps;
        weekly.set(week, (weekly.get(week) ?? 0) + kg * s.reps);
        t.sets += 1;
        t.bestWeightKg = Math.max(t.bestWeightKg, kg);
        t.best1rmKg = Math.max(t.best1rmKg, e1rm);
        const prev = best1rm.get(ex.exerciseId) ?? 0;
        if (e1rm > prev + 1e-6) {
          prs.push({ occurredAt: s.createdAt.toISOString(), exerciseId: ex.exerciseId, setId: s.id, reps: s.reps, weightKg: kg, e1rmKg: e1rm, prevKg: prev });
          best1rm.set(ex.exerciseId, e1rm);
        }
      }
    }
  }

  return {
    kpis: {
      workoutsCount: workouts.length,
      totalVolumeKg,
      avgSessionLengthMinutes: completed > 0 ? totalMinutes / completed : 0,
    },
    topExercises: [...top.entries()]
      .map(([exerciseId, v]) => ({ exerciseId, setCount: v.sets, workoutCount: v.workouts.size, bestWeightKg: v.bestWeightKg, best1rmKg: v.best1rmKg }))
      .sort((a, b) => b.setCount - a.setCount)
      .slice(0, 8),
    recentPrs: prs.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 12),
    volumeTrend: [...weekly.entries()].map(([weekStart, volumeKg]) => ({ weekStart, volumeKg })).sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
  };
}

// shortcut: relative ranges (7d/30d/90d) can be up to 1h stale between saves; saving a workout clears the cache at once.
export const getStats = (userId: string, range: Range, tz: string) =>
  unstable_cache(() => computeStats(userId, range, tz), ["stats", userId, range, tz], {
    tags: [workoutsTag(userId)],
    revalidate: 3600,
  })();
