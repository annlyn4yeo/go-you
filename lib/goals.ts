export type UserGoals = {
  weeklyWorkoutTarget: number;
  monthlyWorkoutTarget: number;
};

export const GOALS_STORAGE_KEY = "go-you.goals.v1";

export const DEFAULT_GOALS: UserGoals = {
  weeklyWorkoutTarget: 4,
  monthlyWorkoutTarget: 16,
};

export function readGoals(): UserGoals {
  if (typeof window === "undefined") return DEFAULT_GOALS;

  try {
    const raw = window.localStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) return DEFAULT_GOALS;

    const parsed = JSON.parse(raw) as Partial<UserGoals>;

    return {
      weeklyWorkoutTarget: clampGoal(parsed.weeklyWorkoutTarget, 1, 14, 4),
      monthlyWorkoutTarget: clampGoal(parsed.monthlyWorkoutTarget, 1, 60, 16),
    };
  } catch {
    return DEFAULT_GOALS;
  }
}

export function writeGoals(goals: UserGoals) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
}

function clampGoal(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}
