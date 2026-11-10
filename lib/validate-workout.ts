export type WorkoutBody = {
  workout: { id: string; startedAt: string; endedAt: string };
  exercises: { id: string; exerciseId: string; order: number; variation?: string }[];
  sets: {
    id: string;
    exerciseInstanceId: string;
    reps: number;
    weight: number;
    unit: string;
    createdAt: string;
  }[];
};

const isId = (v: unknown) => typeof v === "string" && v.length > 0 && v.length <= 64;
const isDate = (v: unknown) => typeof v === "string" && !Number.isNaN(Date.parse(v));

// Returns an error message, or null when the body is a valid workout.
export function validateWorkout(body: unknown): string | null {
  const b = body as Partial<WorkoutBody> | null;
  const w = b?.workout;
  if (!w || !isId(w.id) || !isDate(w.startedAt) || !isDate(w.endedAt)) return "Invalid workout";
  if (Date.parse(w.endedAt) < Date.parse(w.startedAt)) return "Workout ends before it starts";
  if (!Array.isArray(b.exercises) || b.exercises.length > 50) return "Invalid exercises";
  if (!Array.isArray(b.sets) || b.sets.length > 1000) return "Invalid sets";

  const exerciseIds = new Set<string>();
  for (const ex of b.exercises) {
    if (!isId(ex?.id) || exerciseIds.has(ex.id)) return "Invalid exercise id";
    if (typeof ex.exerciseId !== "string" || !/^[a-z0-9_]{1,64}$/.test(ex.exerciseId)) return "Invalid exercise name";
    if (!Number.isInteger(ex.order) || ex.order < 0) return "Invalid exercise order";
    if (ex.variation != null && (typeof ex.variation !== "string" || ex.variation.length > 64)) return "Invalid variation";
    exerciseIds.add(ex.id);
  }
  for (const s of b.sets) {
    if (!isId(s?.id) || !exerciseIds.has(s.exerciseInstanceId)) return "Invalid set";
    if (!Number.isInteger(s.reps) || s.reps < 1 || s.reps > 1000) return "Invalid reps";
    if (typeof s.weight !== "number" || !Number.isFinite(s.weight) || s.weight < 0 || s.weight > 2000) return "Invalid weight";
    if (s.unit !== "kg" && s.unit !== "lb") return "Invalid unit";
    if (!isDate(s.createdAt)) return "Invalid set time";
  }
  return null;
}
