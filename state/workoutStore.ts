import { create } from "zustand";
import { Workout, ExerciseInstance, SetEntry } from "@/domain/workout";

type ActiveWorkout = {
  workout: Workout;
  exercises: ExerciseInstance[];
  sets: SetEntry[];
};

interface WorkoutState {
  activeWorkout: ActiveWorkout | null;

  startWorkout: (userId: string) => void;
  endWorkout: () => void;

  addExercise: (exerciseId: string, variation?: string) => void;
  addSet: (
    exerciseInstanceId: string,
    reps: number,
    weight: number,
    unit: "kg" | "lb"
  ) => void;
}

const generateId = () => crypto.randomUUID();

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeWorkout: null,

  startWorkout: (userId) => {
    const now = new Date().toISOString();

    set({
      activeWorkout: {
        workout: {
          id: generateId(),
          userId,
          startedAt: now,
          endedAt: null,
        },
        exercises: [],
        sets: [],
      },
    });
  },

  endWorkout: () => {
    const state = get().activeWorkout;
    if (!state) return;

    set({
      activeWorkout: null,
    });
  },

  addExercise: (exerciseId, variation) => {
    const state = get().activeWorkout;
    if (!state) return;

    const instance: ExerciseInstance = {
      id: generateId(),
      workoutId: state.workout.id,
      exerciseId,
      order: state.exercises.length,
      variation,
    };

    set({
      activeWorkout: {
        ...state,
        exercises: [...state.exercises, instance],
      },
    });
  },

  addSet: (exerciseInstanceId, reps, weight, unit) => {
    const state = get().activeWorkout;
    if (!state) return;

    const entry: SetEntry = {
      id: generateId(),
      exerciseInstanceId,
      reps,
      weight,
      unit,
      createdAt: new Date().toISOString(),
    };

    set({
      activeWorkout: {
        ...state,
        sets: [...state.sets, entry],
      },
    });
  },
}));
