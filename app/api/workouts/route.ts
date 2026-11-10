export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { workoutsTag } from "@/lib/stats";
import { validateWorkout, type WorkoutBody } from "@/lib/validate-workout";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as WorkoutBody | null;
  const error = validateWorkout(body);
  if (error || !body) {
    return NextResponse.json({ error: error ?? "Invalid body" }, { status: 400 });
  }

  const { workout, exercises, sets } = body;
  try {
    // 3 inserts in one transaction, whatever the workout size.
    await prisma.$transaction([
      prisma.workout.create({
        data: {
          id: workout.id,
          userId,
          startedAt: new Date(workout.startedAt),
          endedAt: new Date(workout.endedAt),
        },
      }),
      prisma.exerciseInstance.createMany({
        data: exercises.map((ex) => ({
          id: ex.id,
          workoutId: workout.id,
          exerciseId: ex.exerciseId,
          order: ex.order,
          variation: ex.variation ?? null,
        })),
      }),
      prisma.setEntry.createMany({
        data: sets.map((s) => ({
          id: s.id,
          exerciseInstanceId: s.exerciseInstanceId,
          reps: s.reps,
          weight: s.weight,
          unit: s.unit,
          createdAt: new Date(s.createdAt),
        })),
      }),
    ]);
  } catch (e) {
    // A retry after a lost response: the workout is already saved for this user.
    const duplicate = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
    const mine = duplicate && (await prisma.workout.count({ where: { id: workout.id, userId } })) > 0;
    if (!mine) {
      return NextResponse.json({ error: duplicate ? "Conflict" : "Could not save" }, { status: duplicate ? 409 : 500 });
    }
  }

  revalidateTag(workoutsTag(userId), { expire: 0 });
  return NextResponse.json({ id: workout.id });
}
