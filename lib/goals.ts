import { useSyncExternalStore } from "react";

export type UserGoals = {
  weeklyWorkoutTarget: number;
  monthlyWorkoutTarget: number;
};

export const GOALS_STORAGE_KEY = "go-you.goals.v1";
const CHANGE_EVENT = "go-you:goals";

export const GOAL_LIMITS = { weekly: [1, 14], monthly: [1, 60] } as const;

export const DEFAULT_GOALS: UserGoals = {
  weeklyWorkoutTarget: 4,
  monthlyWorkoutTarget: 16,
};

export function clampGoal(value: number | undefined, [min, max]: readonly [number, number], fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function parseGoals(raw: string | null): UserGoals {
  if (!raw) return DEFAULT_GOALS;
  try {
    const parsed = JSON.parse(raw) as Partial<UserGoals>;
    return {
      weeklyWorkoutTarget: clampGoal(parsed.weeklyWorkoutTarget, GOAL_LIMITS.weekly, 4),
      monthlyWorkoutTarget: clampGoal(parsed.monthlyWorkoutTarget, GOAL_LIMITS.monthly, 16),
    };
  } catch {
    return DEFAULT_GOALS;
  }
}

export function writeGoals(goals: UserGoals) {
  window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  window.dispatchEvent(new Event(CHANGE_EVENT)); // same-tab subscribers; other tabs get "storage"
}

// The snapshot must be the same object until the stored value changes.
let cache: { raw: string | null; goals: UserGoals } = { raw: null, goals: DEFAULT_GOALS };
function snapshot() {
  const raw = window.localStorage.getItem(GOALS_STORAGE_KEY);
  if (raw !== cache.raw) cache = { raw, goals: parseGoals(raw) };
  return cache.goals;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export const useGoals = () => useSyncExternalStore(subscribe, snapshot, () => DEFAULT_GOALS);
