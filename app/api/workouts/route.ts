export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workouts = await prisma.workout.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      startedAt: "desc",
    },
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
    },
  });

  return NextResponse.json(workouts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const workout = await prisma.workout.create({
    data: {
      id: body.workout.id,
      userId: session.user.id,
      startedAt: new Date(body.workout.startedAt),
      endedAt: new Date(body.workout.endedAt),
      exercises: {
        create: body.exercises.map((ex: any) => ({
          id: ex.id,
          exerciseId: ex.exerciseId,
          order: ex.order,
          variation: ex.variation,
          sets: {
            create: body.sets
              .filter((s: any) => s.exerciseInstanceId === ex.id)
              .map((s: any) => ({
                id: s.id,
                reps: s.reps,
                weight: s.weight,
                unit: s.unit,
                createdAt: new Date(s.createdAt),
              })),
          },
        })),
      },
    },
  });

  return NextResponse.json(workout);
}
