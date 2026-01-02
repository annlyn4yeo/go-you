export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  const workout = await prisma.workout.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: {
          sets: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!workout) {
    return <div>Workout not found</div>;
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Workout</h1>
        <div className="text-sm text-[var(--muted)]">
          {new Date(workout.startedAt).toLocaleString()}
        </div>
      </header>

      {workout.exercises.map((exercise) => (
        <div
          key={exercise.id}
          className="border-t border-[var(--divider)] pt-4 space-y-2"
        >
          <div className="font-medium">{exercise.exerciseId.toUpperCase()}</div>

          <ul className="text-sm space-y-1">
            {exercise.sets.map((set, index) => (
              <li key={set.id}>
                Set {index + 1}: {set.reps} × {set.weight} {set.unit}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
