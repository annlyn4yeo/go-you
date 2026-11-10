import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Workout, ExerciseInstance, SetEntry } from "@/domain/workout";
import type { Unit } from "@/lib/lift";

type ActiveWorkout = {
  workout: Workout;
  title?: string;
  exercises: ExerciseInstance[];
  sets: SetEntry[];
};

interface WorkoutState {
  activeWorkout: ActiveWorkout | null;
  unit: Unit; // remembered across workouts

  setUnit: (unit: Unit) => void;
  startWorkout: (userId: string, title?: string) => void;
  endWorkout: () => void;
  addExercise: (exerciseId: string, label: string, variation?: string) => string | undefined;
  addSet: (exerciseInstanceId: string, reps: number, weight: number, unit: Unit) => SetEntry;
  updateSet: (setId: string, updates: { reps?: number; weight?: number }) => void;
  removeSet: (setId: string) => SetEntry | undefined;
  restoreSet: (entry: SetEntry) => void;
}

const generateId = () => crypto.randomUUID();
const byTime = (a: SetEntry, b: SetEntry) => a.createdAt.localeCompare(b.createdAt);

// Persisted so a reload, tab eviction or failed save never loses the sets (rehydrated in AppShell).
export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => {
      // Applies a change to the active workout, if there is one.
      const patch = (fn: (w: ActiveWorkout) => Partial<ActiveWorkout>) => {
        const w = get().activeWorkout;
        if (w) set({ activeWorkout: { ...w, ...fn(w) } });
      };

      return {
        activeWorkout: null,
        unit: "kg",

        setUnit: (unit) => set({ unit }),

        startWorkout: (userId, title) =>
          set({
            activeWorkout: {
              workout: { id: generateId(), userId, startedAt: new Date().toISOString(), endedAt: null },
              title,
              exercises: [],
              sets: [],
            },
          }),

        endWorkout: () => set({ activeWorkout: null }),

        addExercise: (exerciseId, label, variation) => {
          const id = generateId();
          patch((w) => ({
            exercises: [...w.exercises, { id, workoutId: w.workout.id, exerciseId, label, order: w.exercises.length, variation }],
          }));
          return get().activeWorkout ? id : undefined;
        },

        addSet: (exerciseInstanceId, reps, weight, unit) => {
          const entry = { id: generateId(), exerciseInstanceId, reps, weight, unit, createdAt: new Date().toISOString() };
          patch((w) => ({ sets: [...w.sets, entry] }));
          return entry;
        },

        updateSet: (setId, updates) =>
          patch((w) => ({ sets: w.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)) })),

        removeSet: (setId) => {
          const removed = get().activeWorkout?.sets.find((s) => s.id === setId);
          patch((w) => ({ sets: w.sets.filter((s) => s.id !== setId) }));
          return removed;
        },

        restoreSet: (entry) => patch((w) => ({ sets: [...w.sets, entry].sort(byTime) })),
      };
    },
    { name: "go-you.active-workout.v1", skipHydration: true },
  ),
);
