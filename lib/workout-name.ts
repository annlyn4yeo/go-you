// A readable name for a saved workout: time of day + what was trained ("Morning push"). Pure: also run by node's test runner.
// Computed on read, never stored, so old workouts get names too and the rules can change. Only an own type is stored (DD-062).
import { exactMatch, exerciseOptions } from "./exercises.ts"; // relative: node's test runner has no "@/" alias

type Group = "push" | "pull" | "legs" | "hinge" | "core";
type Kind = { group: Group; arms?: true };

const LIFTS: Record<string, Kind> = {
  bench_press: { group: "push" }, incline_bench_press: { group: "push" }, dumbbell_bench_press: { group: "push" },
  overhead_press: { group: "push" }, dumbbell_shoulder_press: { group: "push" }, dip: { group: "push" }, push_up: { group: "push" },
  lateral_raise: { group: "push" }, cable_fly: { group: "push" },
  tricep_pushdown: { group: "push", arms: true }, skull_crusher: { group: "push", arms: true },
  barbell_row: { group: "pull" }, dumbbell_row: { group: "pull" }, seated_cable_row: { group: "pull" }, pull_up: { group: "pull" },
  chin_up: { group: "pull" }, lat_pulldown: { group: "pull" }, face_pull: { group: "pull" }, rear_delt_fly: { group: "pull" }, shrug: { group: "pull" },
  bicep_curl: { group: "pull", arms: true }, hammer_curl: { group: "pull", arms: true },
  squat: { group: "legs" }, front_squat: { group: "legs" }, romanian_deadlift: { group: "legs" }, hip_thrust: { group: "legs" },
  leg_press: { group: "legs" }, lunge: { group: "legs" }, bulgarian_split_squat: { group: "legs" }, leg_extension: { group: "legs" },
  leg_curl: { group: "legs" }, calf_raise: { group: "legs" },
  deadlift: { group: "hinge" }, // pull day in most splits, leg day in others: decided by the rest of the session
  plank: { group: "core" }, hanging_leg_raise: { group: "core" }, cable_crunch: { group: "core" },
};
const LIBRARY_OPTIONS = exerciseOptions([]);

// The lifter's own names, by word. Order matters: "leg curl" is legs, not arms; "rear delt fly" is pull, not push.
// "push" alone is no keyword ("sled push"); unmatched names don't vote.
const KEYWORDS: [RegExp, Kind][] = [
  [/\b(planks?|crunch(es)?|sit ?ups?|abs|ab wheel|leg raises?|hollow)\b/, { group: "core" }],
  [/\b(squats?|lunges?|legs?|calf|calves|glutes?|hip thrusts?|step ?ups?|hamstrings?|quads?|rdl|romanian|stiff|nordic)\b/, { group: "legs" }],
  [/\bdeadlifts?\b/, { group: "hinge" }],
  [/\bcurls?\b/, { group: "pull", arms: true }],
  [/\b(triceps?|skull ?crushers?|pushdowns?|kickbacks?)\b/, { group: "push", arms: true }],
  [/\b(rows?|pull ?ups?|chin ?ups?|pull ?downs?|shrugs?|face ?pulls?|rear delts?|reverse fly|lats)\b/, { group: "pull" }],
  [/\b(bench|press(es)?|fl(y|ies|yes)|dips?|push ?ups?|pecs?|chest|(lateral|side|front) raises?|delts?)\b/, { group: "push" }],
];

export function liftKind(id: string, name: string): Kind | undefined {
  const lib = exactMatch(id, LIBRARY_OPTIONS) ?? exactMatch(name, LIBRARY_OPTIONS);
  if (lib && LIFTS[lib.id]) return LIFTS[lib.id]; // a library lift missing from LIFTS still gets the keywords
  const words = `${name} ${id}`.toLowerCase().replace(/[_-]/g, " ");
  return KEYWORDS.find(([re]) => re.test(words))?.[1];
}

// The lifter's own workout type (DD-062): only what was trained ("push day"); the time word is fixed and added on read.
// Spaces folded and trimmed, a typed leading time word dropped ("morning push" → "push"), at most 30 characters (the
// longest time word + 30 fits the 40-character column), no control characters. Empty or null = back to the automatic
// type (null). Anything else not acceptable = undefined.
export const TITLE_MAX = 30;
export function cleanTitle(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const title = value.replace(/\s+/g, " ").trim().replace(/^((early|late) )?(morning|afternoon|evening|night)\b[\s,:-]*/i, "");
  if (!title) return null;
  return title.length <= TITLE_MAX && !/\p{Cc}/u.test(title) ? title : undefined;
}

export const timeOfDay = (hour: number) => (hour >= 5 && hour < 12 ? "Morning" : hour >= 12 && hour < 17 ? "Afternoon" : hour >= 17 && hour < 22 ? "Evening" : "Night");

const share = 0.7; // "push day" = 70%+ of the counted sets
const recognised = 0.6; // below this, say "workout" rather than guess

// `hour`: the start hour in the lifter's zone. `exercises`: id (slug), display name, set count.
// `type`: what was trained, the part the lifter can replace. `known` is false when it says nothing (show the exercises then).
// `title`: the lifter's own type, if any; the time word stays either way.
export function workoutName(hour: number, exercises: { id: string; name: string; sets: number }[], title?: string | null) {
  const time = timeOfDay(hour);
  const { type, known } = title ? { type: title, known: true } : workoutType(exercises);
  return { name: `${time} ${type}`, type, known };
}

function workoutType(exercises: { id: string; name: string; sets: number }[]): { type: string; known: boolean } {
  const done = exercises.filter((e) => e.sets > 0);
  if (new Set(done.map((e) => e.id)).size === 1) return { type: done[0].name, known: true };

  const n = { push: 0, pull: 0, legs: 0, hinge: 0, core: 0, arms: 0, total: 0 };
  for (const e of done) {
    const k = liftKind(e.id, e.name);
    n.total += e.sets;
    if (!k) continue;
    n[k.group] += e.sets;
    if (k.arms) n.arms += e.sets;
  }
  const other = n.total - n.core;
  if (n.core && n.core >= share * n.total) return { type: "core", known: true };
  if (!other || n.push + n.pull + n.legs + n.hinge < recognised * other) return { type: "workout", known: false };

  const rest = n.push + n.pull + n.legs;
  if (n.push + n.pull >= share * rest && rest > 0) n.pull += n.hinge;
  else n.legs += n.hinge;
  const upper = n.push + n.pull;
  const all = upper + n.legs;
  const type =
    n.legs >= share * all ? "legs"
    : upper < share * all ? "full body"
    : n.arms >= share * upper ? "arms"
    : n.push >= share * upper ? "push"
    : n.pull >= share * upper ? "pull"
    : "upper body";
  return { type, known: true };
}
