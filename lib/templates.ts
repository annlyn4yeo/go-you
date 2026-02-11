export type TemplateExercise = {
  exerciseId: string;
  label: string;
  variation?: string;
};

export type ProgramTemplate = {
  id: string;
  name: string;
  description: string;
  exercises: TemplateExercise[];
};

export const DEFAULT_TEMPLATES: ProgramTemplate[] = [
  {
    id: "upper-a",
    name: "UPPER A",
    description: "PRESS + ROW FOCUS",
    exercises: [
      { exerciseId: "bench_press", label: "Bench Press" },
      { exerciseId: "barbell_row", label: "Barbell Row" },
      { exerciseId: "overhead_press", label: "Overhead Press" },
      { exerciseId: "lat_pulldown", label: "Lat Pulldown" },
      { exerciseId: "incline_db_press", label: "Incline DB Press" },
    ],
  },
  {
    id: "lower-a",
    name: "LOWER A",
    description: "SQUAT-DOMINANT DAY",
    exercises: [
      { exerciseId: "back_squat", label: "Back Squat" },
      { exerciseId: "romanian_deadlift", label: "Romanian Deadlift" },
      { exerciseId: "walking_lunge", label: "Walking Lunge" },
      { exerciseId: "leg_curl", label: "Leg Curl" },
      { exerciseId: "standing_calf_raise", label: "Standing Calf Raise" },
    ],
  },
  {
    id: "push",
    name: "PUSH",
    description: "CHEST + SHOULDERS + TRICEPS",
    exercises: [
      { exerciseId: "bench_press", label: "Bench Press" },
      { exerciseId: "incline_db_press", label: "Incline DB Press" },
      { exerciseId: "overhead_press", label: "Overhead Press" },
      { exerciseId: "lateral_raise", label: "Lateral Raise" },
      { exerciseId: "tricep_pushdown", label: "Tricep Pushdown" },
    ],
  },
  {
    id: "pull",
    name: "PULL",
    description: "BACK + BICEPS + POSTERIOR CHAIN",
    exercises: [
      { exerciseId: "deadlift", label: "Deadlift" },
      { exerciseId: "pull_up", label: "Pull Up" },
      { exerciseId: "barbell_row", label: "Barbell Row" },
      { exerciseId: "face_pull", label: "Face Pull" },
      { exerciseId: "barbell_curl", label: "Barbell Curl" },
    ],
  },
];

export const CUSTOM_TEMPLATES_STORAGE_KEY = "go-you.custom-templates.v1";

export function readCustomTemplates(): ProgramTemplate[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as ProgramTemplate[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        Array.isArray(item.exercises),
    );
  } catch {
    return [];
  }
}

export function writeCustomTemplates(templates: ProgramTemplate[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CUSTOM_TEMPLATES_STORAGE_KEY,
    JSON.stringify(templates),
  );
}
