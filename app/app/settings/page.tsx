"use client";

import { useEffect, useState } from "react";
import { DEFAULT_GOALS, readGoals, writeGoals } from "@/lib/goals";

export default function SettingsPage() {
  const [weeklyGoal, setWeeklyGoal] = useState(
    DEFAULT_GOALS.weeklyWorkoutTarget,
  );
  const [monthlyGoal, setMonthlyGoal] = useState(
    DEFAULT_GOALS.monthlyWorkoutTarget,
  );
  const [goalSaved, setGoalSaved] = useState(false);

  useEffect(() => {
    const goals = readGoals();
    setWeeklyGoal(goals.weeklyWorkoutTarget);
    setMonthlyGoal(goals.monthlyWorkoutTarget);
  }, []);

  useEffect(() => {
    if (!goalSaved) return;
    const timer = window.setTimeout(() => setGoalSaved(false), 1600);
    return () => window.clearTimeout(timer);
  }, [goalSaved]);

  function handleSaveGoals() {
    const normalized = {
      weeklyWorkoutTarget: Math.max(1, Math.min(14, Math.round(weeklyGoal))),
      monthlyWorkoutTarget: Math.max(1, Math.min(60, Math.round(monthlyGoal))),
    };

    writeGoals(normalized);
    setWeeklyGoal(normalized.weeklyWorkoutTarget);
    setMonthlyGoal(normalized.monthlyWorkoutTarget);
    setGoalSaved(true);
  }

  return (
    <section className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">GOALS</h1>
        <div className="text-sm text-[var(--muted)]">
          Workout targets tracked on your dashboard.
        </div>
      </header>

      <section className="border border-[var(--divider)] p-5 space-y-4">
        <div className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)]">
          GOAL TRACKING
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <div className="text-xs tracking-wide">WEEKLY WORKOUT TARGET</div>
            <input
              type="number"
              min={1}
              max={14}
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(Number(e.target.value))}
              className="w-full border border-[var(--divider)] px-3 py-2 text-lg font-semibold"
            />
          </label>
          <label className="space-y-2">
            <div className="text-xs tracking-wide">MONTHLY WORKOUT TARGET</div>
            <input
              type="number"
              min={1}
              max={60}
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(Number(e.target.value))}
              className="w-full border border-[var(--divider)] px-3 py-2 text-lg font-semibold"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveGoals}
            className="border-2 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] px-4 py-2 text-sm font-bold tracking-wide"
          >
            SAVE GOALS
          </button>
          {goalSaved && (
            <span className="text-xs text-[var(--muted)]">Saved</span>
          )}
        </div>
      </section>
    </section>
  );
}
