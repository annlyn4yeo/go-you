export type UUID = string;

/**
 * A single workout session (one start → one end)
 */
export interface Workout {
  id: UUID;
  userId: UUID;
  startedAt: string; // ISO timestamp
  endedAt: string | null;
  notes?: string;
}

/**
 * Canonical exercise (Squat, Bench, etc.)
 */
export interface Exercise {
  id: UUID;
  name: string;
  category?: string;
}

/**
 * An exercise as performed in a workout
 * (same exercise can appear multiple times)
 */
export interface ExerciseInstance {
  id: UUID;
  workoutId: UUID;
  exerciseId: UUID;
  order: number;
  variation?: string;
}

/**
 * Atomic fact — never edited once saved
 */
export interface SetEntry {
  id: UUID;
  exerciseInstanceId: UUID;
  reps: number;
  weight: number;
  unit: "kg" | "lb";
  restSeconds?: number;
  createdAt: string;
}
