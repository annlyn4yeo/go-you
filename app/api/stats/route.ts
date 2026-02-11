export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Unit = "kg" | "lb";
type Range = "7d" | "30d" | "90d" | "all";

const KG_PER_LB = 0.45359237;

function toKg(weight: number, unit: string): number {
  return unit === "lb" ? weight * KG_PER_LB : weight;
}

function fromKg(weightKg: number, unit: Unit): number {
  return unit === "lb" ? weightKg / KG_PER_LB : weightKg;
}

function estimate1rmKg(weight: number, reps: number, unit: string): number {
  const weightKg = toKg(weight, unit);
  return weightKg * (1 + reps / 30);
}

function resolveRange(value: string | null): Range {
  if (value === "7d" || value === "30d" || value === "90d" || value === "all")
    return value;
  return "90d";
}

function resolveUnit(value: string | null): Unit {
  if (value === "kg" || value === "lb") return value;
  return "kg";
}

function getSince(range: Range): Date | null {
  if (range === "all") return null;

  const now = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const since = new Date(now);
  since.setDate(now.getDate() - days);
  return since;
}

function startOfWeekUtc(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = resolveRange(searchParams.get("range"));
  const unit = resolveUnit(searchParams.get("unit"));
  const since = getSince(range);

  const workouts = await prisma.workout.findMany({
    where: {
      userId: session.user.id,
      ...(since ? { startedAt: { gte: since } } : {}),
    },
    orderBy: { startedAt: "asc" },
    include: {
      exercises: {
        include: {
          sets: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  let totalVolumeKg = 0;
  let totalDurationMinutes = 0;
  let completedWorkouts = 0;

  const topExerciseMap = new Map<
    string,
    {
      sets: number;
      workouts: Set<string>;
      bestWeightKg: number;
      best1rmKg: number;
    }
  >();

  const prs: {
    occurredAt: string;
    exerciseId: string;
    setId: string;
    reps: number;
    weightKg: number;
    estimated1rmKg: number;
    previous1rmKg: number;
  }[] = [];

  const exerciseBest1rm = new Map<string, number>();
  const weeklyVolume = new Map<string, number>();

  for (const workout of workouts) {
    if (workout.endedAt) {
      const durationMs =
        workout.endedAt.getTime() - workout.startedAt.getTime();
      totalDurationMinutes += Math.max(0, durationMs / 60000);
      completedWorkouts += 1;
    }

    const weekKey = startOfWeekUtc(workout.startedAt).toISOString();

    for (const exercise of workout.exercises) {
      if (!topExerciseMap.has(exercise.exerciseId)) {
        topExerciseMap.set(exercise.exerciseId, {
          sets: 0,
          workouts: new Set<string>(),
          bestWeightKg: 0,
          best1rmKg: 0,
        });
      }

      const top = topExerciseMap.get(exercise.exerciseId)!;
      top.workouts.add(workout.id);

      for (const set of exercise.sets) {
        const weightKg = toKg(set.weight, set.unit);
        const setVolumeKg = weightKg * set.reps;
        const oneRmKg = estimate1rmKg(set.weight, set.reps, set.unit);

        totalVolumeKg += setVolumeKg;
        top.sets += 1;
        top.bestWeightKg = Math.max(top.bestWeightKg, weightKg);
        top.best1rmKg = Math.max(top.best1rmKg, oneRmKg);

        const currentWeekVolume = weeklyVolume.get(weekKey) ?? 0;
        weeklyVolume.set(weekKey, currentWeekVolume + setVolumeKg);

        const previousBest = exerciseBest1rm.get(exercise.exerciseId) ?? 0;
        if (oneRmKg > previousBest + 1e-6) {
          prs.push({
            occurredAt: set.createdAt.toISOString(),
            exerciseId: exercise.exerciseId,
            setId: set.id,
            reps: set.reps,
            weightKg,
            estimated1rmKg: oneRmKg,
            previous1rmKg: previousBest,
          });
          exerciseBest1rm.set(exercise.exerciseId, oneRmKg);
        }
      }
    }
  }

  const workoutsCount = workouts.length;
  const avgSessionLengthMinutes =
    completedWorkouts > 0 ? totalDurationMinutes / completedWorkouts : 0;

  const topExercises = Array.from(topExerciseMap.entries())
    .map(([exerciseId, value]) => ({
      exerciseId,
      setCount: value.sets,
      workoutCount: value.workouts.size,
      bestWeight: fromKg(value.bestWeightKg, unit),
      bestEstimated1rm: fromKg(value.best1rmKg, unit),
    }))
    .sort((a, b) => b.setCount - a.setCount)
    .slice(0, 8);

  const recentPrs = prs
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
    .slice(0, 12)
    .map((pr) => ({
      occurredAt: pr.occurredAt,
      exerciseId: pr.exerciseId,
      setId: pr.setId,
      reps: pr.reps,
      weight: fromKg(pr.weightKg, unit),
      estimated1rm: fromKg(pr.estimated1rmKg, unit),
      previousEstimated1rm: fromKg(pr.previous1rmKg, unit),
      deltaEstimated1rm: fromKg(pr.estimated1rmKg - pr.previous1rmKg, unit),
    }));

  const volumeTrend = Array.from(weeklyVolume.entries())
    .map(([weekStart, volumeKg]) => ({
      weekStart,
      volume: fromKg(volumeKg, unit),
    }))
    .sort(
      (a, b) =>
        new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime(),
    );

  return NextResponse.json({
    filters: { range, unit },
    kpis: {
      workoutsCount,
      totalVolume: fromKg(totalVolumeKg, unit),
      avgSessionLengthMinutes,
    },
    topExercises,
    recentPrs,
    volumeTrend,
  });
}
