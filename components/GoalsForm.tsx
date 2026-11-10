"use client";

import { useState } from "react";
import NumberField from "@/components/NumberField";
import { clampGoal, GOAL_LIMITS, useGoals, writeGoals } from "@/lib/goals";

export default function GoalsForm() {
  const goals = useGoals();
  // Edits live here until saved; null = show the stored value.
  const [weekly, setWeekly] = useState<string | null>(null);
  const [monthly, setMonthly] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const weeklyValue = weekly ?? String(goals.weeklyWorkoutTarget);
  const monthlyValue = monthly ?? String(goals.monthlyWorkoutTarget);

  function save(e: React.FormEvent) {
    e.preventDefault();
    writeGoals({
      weeklyWorkoutTarget: clampGoal(Number(weeklyValue), GOAL_LIMITS.weekly, goals.weeklyWorkoutTarget),
      monthlyWorkoutTarget: clampGoal(Number(monthlyValue), GOAL_LIMITS.monthly, goals.monthlyWorkoutTarget),
    });
    setWeekly(null);
    setMonthly(null);
    setSaved(true);
  }

  const edit = (set: (v: string) => void) => (v: string) => {
    set(v);
    setSaved(false);
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <NumberField
          id="weekly"
          label="Workouts per week"
          value={weeklyValue}
          onChange={edit(setWeekly)}
          step={1}
          min={GOAL_LIMITS.weekly[0]}
          hint={`${GOAL_LIMITS.weekly[0]}–${GOAL_LIMITS.weekly[1]}`}
        />
        <NumberField
          id="monthly"
          label="Workouts per month"
          value={monthlyValue}
          onChange={edit(setMonthly)}
          step={1}
          min={GOAL_LIMITS.monthly[0]}
          hint={`${GOAL_LIMITS.monthly[0]}–${GOAL_LIMITS.monthly[1]}`}
        />
      </div>
      <div className="flex items-center gap-4">
        <button type="submit" className="btn btn-primary btn-lg px-8">
          Save goals
        </button>
        <p role="status" className="label">
          {saved ? "Saved" : ""}
        </p>
      </div>
    </form>
  );
}
