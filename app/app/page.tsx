"use client";

import { useSession } from "next-auth/react";
import { useWorkoutStore } from "@/state/workoutStore";
import { useState } from "react";
import SetRow from "@/components/SetRow";

const EXERCISES = [
  { id: "squat", name: "Squat" },
  { id: "bench", name: "Bench Press" },
  { id: "deadlift", name: "Deadlift" },
];

export default function DashboardPage() {
  const { activeWorkout, startWorkout, addExercise, addSet } =
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

  // ------------------------
  // IDLE STATE
  // ------------------------
  if (!activeWorkout) {
    return (
      <section className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="text-sm text-[var(--muted)]">No active workout</div>
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

  // ------------------------
  // LIVE WORKOUT
  // ------------------------
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

      {/* EXERCISES */}
      <section className="space-y-6">
        {activeWorkout.exercises.map((exercise) => (
          <ExerciseBlock
            key={exercise.id}
            exercise={exercise}
            addSet={addSet}
          />
        ))}
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

function ExerciseBlock({
  exercise,
  addSet,
}: {
  exercise: any;
  addSet: (
    exerciseInstanceId: string,
    reps: number,
    weight: number,
    unit: "kg" | "lb"
  ) => void;
}) {
  const workout = useWorkoutStore((s) => s.activeWorkout);

  const sets =
    workout?.sets.filter((s) => s.exerciseInstanceId === exercise.id) ?? [];

  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="border-t border-[var(--divider)] pt-6 space-y-4">
      <div className="font-medium">{exercise.exerciseId.toUpperCase()}</div>

      {sets.length > 0 && (
        <ul className="space-y-1">
          {sets.map((set, index) => (
            <SetRow key={set.id} set={set} index={index} />
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="w-20 border border-[var(--divider)] px-3 py-2 text-sm leading-none outline-none focus:border-[var(--fg)]"
          />

          <input
            type="number"
            placeholder="Weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-20 border border-[var(--divider)] px-3 py-2 text-sm leading-none outline-none focus:border-[var(--fg)]"
          />

          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as "kg" | "lb")}
            className="border border-[var(--divider)] px-2 py-2 text-sm bg-transparent"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>

          <button
            type="button"
            className="border border-[var(--fg)] px-3 py-2 text-sm"
            onClick={() => {
              const repsNum = Number(reps);
              const weightNum = Number(weight);

              if (!repsNum || repsNum <= 0) {
                setError("Reps must be greater than 0");
                return;
              }

              if (!weightNum || weightNum <= 0) {
                setError("Weight must be greater than 0");
                return;
              }

              addSet(exercise.id, repsNum, weightNum, unit);

              setReps("");
              setWeight("");
              setError(null);
            }}
          >
            Add Set
          </button>
        </div>

        {error && <div className="text-xs text-red-600">{error}</div>}
      </div>
    </div>
  );
}
