"use client";
import { useSession } from "next-auth/react";
import { useWorkoutStore } from "@/state/workoutStore";

const EXERCISES = [
  { id: "squat", name: "Squat" },
  { id: "bench", name: "Bench Press" },
  { id: "deadlift", name: "Deadlift" },
];

export default function DashboardPage() {
  const { activeWorkout, startWorkout, endWorkout, addExercise, addSet } =
    useWorkoutStore();

  const { data: session } = useSession();

  async function handleEndWorkout() {
    const workoutState = useWorkoutStore.getState().activeWorkout;
    if (!workoutState) return;
    if (!session?.user?.id) return;

    await fetch("/api/workouts", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workout: {
          id: workoutState.workout.id,
          startedAt: workoutState.workout.startedAt,
          endedAt: new Date().toISOString(),
        },
        exercises: workoutState.exercises,
        sets: workoutState.sets,
      }),
    });

    useWorkoutStore.getState().endWorkout();
  }

  // IDLE STATE — NO ACTIVE WORKOUT
  if (!activeWorkout) {
    return (
      <section className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="text-[var(--muted)] text-sm">No active workout</div>
        </header>

        <section className="border-t border-[var(--divider)] pt-6">
          <button
            type="button"
            className="border border-[var(--fg)] px-6 py-2 font-medium"
            onClick={() => {
              if (!session?.user?.id) return;
              startWorkout(session.user.id);
            }}
          >
            START WORKOUT
          </button>
        </section>
      </section>
    );
  }

  // LIVE WORKOUT STATE
  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Workout in progress</h1>
        <div className="text-sm text-[var(--muted)]">Logging live session</div>
      </header>

      {/* ADD EXERCISE */}
      <section className="border-t border-[var(--divider)] pt-6">
        <div className="text-sm font-medium mb-3">Add exercise</div>

        <div className="flex gap-2">
          {EXERCISES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              className="border border-[var(--divider)] px-3 py-1 text-sm"
              onClick={() => addExercise(ex.id)}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </section>

      {/* EXERCISES IN WORKOUT */}
      <section className="space-y-6">
        {activeWorkout.exercises.length === 0 && (
          <div className="text-sm text-[var(--muted)]">
            No exercises added yet
          </div>
        )}

        {activeWorkout.exercises.map((exercise) => {
          const sets = activeWorkout.sets.filter(
            (s) => s.exerciseInstanceId === exercise.id
          );

          return (
            <div
              key={exercise.id}
              className="border-t border-[var(--divider)] pt-4 space-y-3"
            >
              <div className="font-medium">
                {exercise.exerciseId.toUpperCase()}
              </div>

              {/* SET LIST */}
              {sets.length > 0 && (
                <ul className="text-sm space-y-1">
                  {sets.map((set, index) => (
                    <li key={set.id}>
                      Set {index + 1}: {set.reps} × {set.weight} {set.unit}
                    </li>
                  ))}
                </ul>
              )}

              {/* ADD SET */}
              <button
                type="button"
                className="border border-[var(--divider)] px-3 py-1 text-sm"
                onClick={() => addSet(exercise.id, 5, 60, "kg")}
              >
                Add set (5 × 60kg)
              </button>
            </div>
          );
        })}
      </section>

      {/* END WORKOUT */}
      <section className="border-t border-[var(--divider)] pt-6">
        <button
          type="button"
          className="border border-[var(--fg)] px-6 py-2 font-medium"
          onClick={handleEndWorkout}
        >
          END WORKOUT
        </button>
      </section>
    </section>
  );
}
