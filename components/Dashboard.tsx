"use client";

import Link from "next/link";
import { useState } from "react";
import { useWorkoutStore } from "@/state/workoutStore";
import { useGoals } from "@/lib/goals";
import { DEFAULT_TEMPLATES, ProgramTemplate } from "@/lib/templates";
import type { ExerciseHistory } from "@/lib/history";
import Logger, { type Receipt } from "@/components/Logger";

export default function Dashboard({
  userId,
  weeklyCount,
  monthlyCount,
  history,
}: {
  userId: string;
  weeklyCount: number;
  monthlyCount: number;
  history: ExerciseHistory;
}) {
  const stored = useWorkoutStore((s) => s.activeWorkout);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  // A workout left on this device by another account is not shown.
  const activeWorkout = stored?.workout.userId === userId ? stored : null;
  const goals = useGoals();
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  if (activeWorkout) return <Logger history={history} onSaved={setReceipt} />;

  function startFromTemplate(template: ProgramTemplate) {
    startWorkout(userId, template.name);
    const { addExercise } = useWorkoutStore.getState();
    template.exercises.forEach((ex) => addExercise(ex.exerciseId, ex.label, ex.variation));
    window.scrollTo(0, 0);
  }

  return (
    <section className="space-y-10">
      {receipt && <SavedReceipt receipt={receipt} onDismiss={() => setReceipt(null)} />}

      <header className="space-y-2">
        <p className="label">No active workout</p>
        <h1 className="display text-5xl">Train</h1>
      </header>

      <button type="button" className="btn btn-primary btn-lg w-full" onClick={() => startWorkout(userId)}>
        Start blank
      </button>

      <section aria-labelledby="templates" className="space-y-3">
        <h2 id="templates" className="label">
          Templates
        </h2>
        <ul className="border-b border-[var(--divider)]">
          {DEFAULT_TEMPLATES.map((t) => (
            <li key={t.id} className="border-t border-[var(--divider)]">
              <button
                type="button"
                onClick={() => startFromTemplate(t)}
                aria-label={`Start ${t.name}`}
                className="press grid w-full grid-cols-[1fr_auto] items-center gap-4 py-4 text-left"
              >
                <span className="min-w-0 space-y-1">
                  <span className="block text-lg font-bold leading-tight tracking-[-0.01em]">{t.name}</span>
                  <span className="block truncate text-xs text-[var(--muted)]">
                    {t.exercises.length} EX · {t.exercises.map((e) => e.label.toUpperCase()).join(" / ")}
                  </span>
                </span>
                <span className="label text-[var(--fg)]">Start →</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="goals" className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 id="goals" className="label">
            Goals
          </h2>
          <Link href="/app/settings" className="label text-[var(--fg)] underline underline-offset-4">
            Edit
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-px border border-[var(--divider)] bg-[var(--divider)]">
          <GoalCell label="Weekly goal" count={weeklyCount} target={goals.weeklyWorkoutTarget} />
          <GoalCell label="Monthly goal" count={monthlyCount} target={goals.monthlyWorkoutTarget} />
        </div>
      </section>
    </section>
  );
}

function GoalCell({ label, count, target }: { label: string; count: number; target: number }) {
  return (
    <div className="space-y-3 bg-[var(--bg)] p-4">
      <div className="label">{label}</div>
      <div className="text-4xl font-bold leading-none tracking-[-0.02em] tabular">
        {count}
        <span className="text-base font-semibold text-[var(--muted)]"> / {target}</span>
      </div>
      <SegmentedBar count={count} target={target} />
    </div>
  );
}

// One segment per workout when they fit; a plain bar for big monthly targets.
function SegmentedBar({ count, target }: { count: number; target: number }) {
  const done = Math.min(count, target);
  if (target > 16) {
    return (
      <div role="img" aria-label={`${done} of ${target}`} className="h-2 bg-[var(--divider)]">
        <div className="h-full bg-[var(--fg)]" style={{ width: `${(done / target) * 100}%` }} />
      </div>
    );
  }
  return (
    <div role="img" aria-label={`${done} of ${target}`} className="flex h-2 gap-[2px]">
      {Array.from({ length: target }, (_, i) => (
        <span key={i} className={`flex-1 ${i < done ? "bg-[var(--fg)]" : "bg-[var(--divider)]"}`} />
      ))}
    </div>
  );
}

// The peak-end moment: what you just did, in one inverted block.
function SavedReceipt({ receipt, onDismiss }: { receipt: Receipt; onDismiss: () => void }) {
  return (
    <section role="status" className="space-y-4 bg-[var(--fg)] p-5 text-[var(--bg)]">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">Workout saved</p>
        <button type="button" onClick={onDismiss} className="press label text-[var(--bg)] underline underline-offset-4">
          Dismiss
        </button>
      </div>
      <dl className="grid grid-cols-3 gap-4">
        {[
          ["Time", receipt.duration],
          ["Sets", String(receipt.sets)],
          ["PRs", String(receipt.prs)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">{k}</dt>
            <dd className="text-3xl font-bold leading-none tabular">{v}</dd>
          </div>
        ))}
      </dl>
      {receipt.prs > 0 && <p className="text-sm font-semibold">{receipt.prNames.join(" · ")}</p>}
    </section>
  );
}
