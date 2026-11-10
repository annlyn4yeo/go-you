import { exerciseName } from "./lift.ts"; // relative: also loaded by node's test runner, which has no "@/" alias

// Templates are earned: after this many saved sessions, GO—YOU builds them from what the lifter repeats (DD-037).
export const TEMPLATE_UNLOCK_SESSIONS = 21;

export type ProgramTemplate = {
  id: string;
  name: string;
  timesDone: number;
  exercises: { exerciseId: string; label: string }[];
};

// `workouts`: newest first, each the ordered exercise slugs of one session.
// Same set of exercises = same routine. A routine must repeat to count; most repeated first, ties by recency.
// shortcut: swapping one exercise makes a new routine (no fuzzy matching); upgrade if users vary their sessions a lot.
export function buildTemplates(workouts: string[][], max = 4): ProgramTemplate[] {
  const groups = new Map<string, { order: string[]; count: number }>();
  for (const ids of workouts) {
    const order = [...new Set(ids)];
    if (order.length < 2) continue; // one exercise is not a routine
    const key = [...order].sort().join("|");
    const g = groups.get(key);
    if (g) g.count += 1;
    else groups.set(key, { order, count: 1 }); // first seen = newest session, so its order is kept
  }
  return [...groups.entries()]
    .filter(([, g]) => g.count >= 2)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, max)
    .map(([key, g], i) => ({
      id: key,
      name: `ROUTINE ${String.fromCharCode(65 + i)}`,
      timesDone: g.count,
      exercises: g.order.map((exerciseId) => ({ exerciseId, label: exerciseName(exerciseId) })),
    }));
}
