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
import { cleanTitle } from "@/lib/workout-name";

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
  // The lifter's name for each new exercise (the first name used is kept). Runs beside the workout transaction, so a save
  // costs no extra round trip; it is not part of it, because a missing name only falls back to the slug.
  const names = [...new Map(exercises.filter((e) => e.label).map((e) => [e.exerciseId, e.label!.trim()])).entries()];
  // The in-progress copy of this workout goes too (P1-01): nothing left to resume. Same side lane, same reasoning.
  const sideWrites = Promise.all([
    prisma.exercise.createMany({ data: names.map(([id, name]) => ({ userId, id, name })), skipDuplicates: true }),
    prisma.workoutDraft.deleteMany({ where: { userId, workoutId: workout.id } }),
  ]).catch(() => {});
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

  await sideWrites; // before the caches are cleared, so the next page shows the names
  revalidateTag(workoutsTag(userId), { expire: 0 });
  return NextResponse.json({ id: workout.id });
}

// PATCH {id, title}: the lifter's own name for a saved workout (DD-062); title null or empty = the automatic name again.
// Scoped to the user: someone else's id (or a gone one) is a 404. No cache holds titles, so nothing to revalidate.
export async function PATCH(req: Request) {
  const userId = (await getServerSession(authOptions))?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { id?: unknown; title?: unknown } | null;
  const title = cleanTitle(body?.title);
  if (typeof body?.id !== "string" || title === undefined) return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  const { count } = await prisma.workout.updateMany({ where: { id: body.id, userId }, data: { title } });
  if (!count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ title });
}

// DELETE ?id=<workout>: remove a saved workout and its sets (P2-04). No cascades in the schema, so children go first, in one transaction.
// Scoped to the user at every level; an id that is gone (or not theirs) is a 204 too, so a retry after a lost response is harmless.
export async function DELETE(req: Request) {
  const userId = (await getServerSession(authOptions))?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const workout = { id, userId };
  await prisma.$transaction([
    prisma.setEntry.deleteMany({ where: { exerciseInstance: { workout } } }),
    prisma.exerciseInstance.deleteMany({ where: { workout } }),
    prisma.workout.deleteMany({ where: workout }),
  ]);
  revalidateTag(workoutsTag(userId), { expire: 0 });
  return new NextResponse(null, { status: 204 });
}
