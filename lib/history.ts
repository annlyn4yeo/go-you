import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { workoutsTag } from "@/lib/stats";
import { KG_PER_LB } from "@/lib/lift";

export type LastSet = { reps: number; weight: number; unit: string };
export type ExerciseHistory = {
  last: Record<string, LastSet[]>; // sets from the most recent session of each exercise
  bestE1rmKg: Record<string, number>; // all-time best Epley e1RM per exercise
};

// Best Epley e1RM (kg) per exercise, optionally only from workouts that started before `before`.
export async function bestE1rmByExercise(userId: string, before?: Date): Promise<Record<string, number>> {
  const rows = await prisma.$queryRaw<{ exerciseId: string; best: number }[]>`
    SELECT ei."exerciseId",
           MAX(CASE WHEN s.unit = 'lb' THEN s.weight * ${KG_PER_LB} ELSE s.weight END * (1 + s.reps::float8 / 30)) AS best
    FROM "SetEntry" s
    JOIN "ExerciseInstance" ei ON ei.id = s."exerciseInstanceId"
    JOIN "Workout" w ON w.id = ei."workoutId"
    WHERE w."userId" = ${userId} ${before ? Prisma.sql`AND w."startedAt" < ${before}` : Prisma.empty}
    GROUP BY ei."exerciseId"`;
  return Object.fromEntries(rows.map((r) => [r.exerciseId, Number(r.best)]));
}

async function load(userId: string): Promise<ExerciseHistory> {
  const [recent, bestE1rmKg] = await Promise.all([
    // shortcut: only the last 150 exercise entries are scanned for "last session"; older-only exercises show no LAST line.
    prisma.exerciseInstance.findMany({
      where: { workout: { userId } },
      orderBy: { workout: { startedAt: "desc" } },
      take: 150,
      relationLoadStrategy: "join",
      select: { exerciseId: true, sets: { orderBy: { createdAt: "asc" }, select: { reps: true, weight: true, unit: true } } },
    }),
    bestE1rmByExercise(userId),
  ]);

  const last: ExerciseHistory["last"] = {};
  for (const ex of recent) if (!last[ex.exerciseId] && ex.sets.length) last[ex.exerciseId] = ex.sets;
  return { last, bestE1rmKg };
}

export const getExerciseHistory = (userId: string) =>
  unstable_cache(() => load(userId), ["history", userId], { tags: [workoutsTag(userId)], revalidate: 3600 })();
