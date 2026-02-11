"use client";

import { useSession } from "next-auth/react";
import { useWorkoutStore } from "@/state/workoutStore";
import { useEffect, useMemo, useState } from "react";
import SetRow from "@/components/SetRow";
import AddExerciseInput from "@/components/AddExerciseInput";
import Link from "next/link";
import { DEFAULT_GOALS, readGoals, UserGoals } from "@/lib/goals";
import {
  DEFAULT_TEMPLATES,
  ProgramTemplate,
  readCustomTemplates,
} from "@/lib/templates";

type WorkoutLogItem = {
  id: string;
  startedAt: string;
  endedAt: string | null;
};

function getWeekStartLocal(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  return start;
}

function getMonthStartLocal(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatPct(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function DashboardPage() {
  const { activeWorkout, startWorkout, addExercise, addSet } =
    useWorkoutStore();

  const { data: session } = useSession();
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS);
  const [templates, setTemplates] =
    useState<ProgramTemplate[]>(DEFAULT_TEMPLATES);
  const [workouts, setWorkouts] = useState<WorkoutLogItem[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  useEffect(() => {
    setGoals(readGoals());
    setTemplates([...DEFAULT_TEMPLATES, ...readCustomTemplates()]);
  }, []);

  useEffect(() => {
    function syncFromStorage() {
      setGoals(readGoals());
      setTemplates([...DEFAULT_TEMPLATES, ...readCustomTemplates()]);
    }

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("focus", syncFromStorage);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("focus", syncFromStorage);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setOverviewLoading(true);

    fetch("/api/workouts", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((items: WorkoutLogItem[]) => {
        if (!cancelled) setWorkouts(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setWorkouts([]);
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const progress = useMemo(() => {
    const now = new Date();
    const weekStart = getWeekStartLocal(now);
    const monthStart = getMonthStartLocal(now);

    const weeklyCount = workouts.filter(
      (w) => new Date(w.startedAt).getTime() >= weekStart.getTime(),
    ).length;

    const monthlyCount = workouts.filter(
      (w) => new Date(w.startedAt).getTime() >= monthStart.getTime(),
    ).length;

    const weeklyTarget = Math.max(goals.weeklyWorkoutTarget, 1);
    const monthlyTarget = Math.max(goals.monthlyWorkoutTarget, 1);

    return {
      weeklyCount,
      monthlyCount,
      weeklyTarget,
      monthlyTarget,
      weeklyPct: formatPct((weeklyCount / weeklyTarget) * 100),
      monthlyPct: formatPct((monthlyCount / monthlyTarget) * 100),
    };
  }, [goals, workouts]);

  function startFromTemplate(template: ProgramTemplate) {
    if (!session?.user?.id) return;
    startWorkout(session.user.id);
    const store = useWorkoutStore.getState();

    template.exercises.forEach((exercise) => {
      store.addExercise(
        exercise.exerciseId,
        exercise.label,
        exercise.variation,
      );
    });
  }

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
        <header className="space-y-2">
          <div className="text-xs tracking-[0.24em] text-[var(--muted)]">
            TRAINING CONTROL PANEL
          </div>
          <h1 className="text-4xl font-black tracking-tight">DASHBOARD</h1>
          <div className="text-sm text-[var(--muted)]">
            Start blank or launch a template. Keep goals visible.
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_1fr]">
          <section className="border border-[var(--divider)] p-5 space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)]">
                NOW
              </div>
              <div className="text-3xl font-black leading-none">
                NO ACTIVE WORKOUT
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="border-2 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] px-5 py-2 text-sm font-bold tracking-wide"
                onClick={() => {
                  if (!session?.user?.id) return;
                  startWorkout(session.user.id);
                }}
              >
                START BLANK
              </button>
              <Link
                href="/app/settings"
                className="border border-[var(--divider)] px-5 py-2 text-sm font-bold tracking-wide"
              >
                EDIT GOALS / TEMPLATES
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <GoalCard
                label="WEEKLY GOAL"
                count={progress.weeklyCount}
                target={progress.weeklyTarget}
                percent={progress.weeklyPct}
                loading={overviewLoading}
              />
              <GoalCard
                label="MONTHLY GOAL"
                count={progress.monthlyCount}
                target={progress.monthlyTarget}
                percent={progress.monthlyPct}
                loading={overviewLoading}
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)]">
              PROGRAM TEMPLATES
            </div>
            <div className="grid grid-cols-1 gap-3">
              {templates.map((template) => (
                <article
                  key={template.id}
                  className="border border-[var(--divider)] p-4 grid grid-cols-[1fr_auto] gap-4 items-start"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl font-black leading-none">
                      {template.name}
                    </h2>
                    <div className="text-xs tracking-wide text-[var(--muted)]">
                      {template.description}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {template.exercises.length} exercises
                    </div>
                    <div className="text-xs leading-relaxed">
                      {template.exercises
                        .slice(0, 4)
                        .map((item) => item.label.toUpperCase())
                        .join(" / ")}
                      {template.exercises.length > 4 ? " / ..." : ""}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="border border-[var(--fg)] px-3 py-2 text-xs font-bold tracking-wide whitespace-nowrap"
                    onClick={() => startFromTemplate(template)}
                  >
                    START
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
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
        <AddExerciseInput
          onAdd={(exerciseId, label) => addExercise(exerciseId, label)}
        />
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

function GoalCard({
  label,
  count,
  target,
  percent,
  loading,
}: {
  label: string;
  count: number;
  target: number;
  percent: number;
  loading: boolean;
}) {
  return (
    <article className="border border-[var(--divider)] p-4 space-y-3">
      <div className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)]">
        {label}
      </div>
      <div className="text-4xl font-black leading-none tabular-nums">
        {loading ? "--" : count}
        <span className="text-base text-[var(--muted)]"> / {target}</span>
      </div>
      <div className="h-4 border border-[var(--fg)] relative">
        <div
          className="absolute left-0 top-0 h-full bg-[var(--fg)]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-xs text-[var(--muted)]">{percent}% complete</div>
    </article>
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
    unit: "kg" | "lb",
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
      <div className="font-medium">{exercise.label.toUpperCase()}</div>
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
