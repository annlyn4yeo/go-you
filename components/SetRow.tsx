"use client";

import { useState } from "react";
import { useWorkoutStore } from "@/state/workoutStore";

export default function SetRow({ set, index }: { set: any; index: number }) {
  const { updateSet, removeSet } = useWorkoutStore();

  const [editingReps, setEditingReps] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);

  const [reps, setReps] = useState(String(set.reps));
  const [weight, setWeight] = useState(String(set.weight));
  const [error, setError] = useState<string | null>(null);

  function commitReps() {
    const value = Number(reps);
    if (!value || value <= 0) {
      setError("Invalid reps");
      return;
    }

    updateSet(set.id, { reps: value });
    setEditingReps(false);
    setError(null);
  }

  function commitWeight() {
    const value = Number(weight);
    if (!value || value <= 0) {
      setError("Invalid weight");
      return;
    }

    updateSet(set.id, { weight: value });
    setEditingWeight(false);
    setError(null);
  }

  return (
    <li className="group flex items-center justify-between py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-[var(--muted)]">Set {index + 1}:</span>

        {editingReps ? (
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={commitReps}
            onKeyDown={(e) => e.key === "Enter" && commitReps()}
            className="w-12 border-b border-[var(--fg)] outline-none bg-transparent"
            autoFocus
          />
        ) : (
          <span
            className="cursor-pointer font-medium text-[15px]"
            onClick={() => setEditingReps(true)}
          >
            {set.reps}
          </span>
        )}

        <span>×</span>

        {editingWeight ? (
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={commitWeight}
            onKeyDown={(e) => e.key === "Enter" && commitWeight()}
            className="w-16 border-b border-[var(--fg)] outline-none bg-transparent"
            autoFocus
          />
        ) : (
          <span
            className="cursor-pointer font-medium text-[15px]"
            onClick={() => setEditingWeight(true)}
          >
            {set.weight}
          </span>
        )}

        <span className="text-[var(--muted)]">{set.unit}</span>
      </div>

      <button
        onClick={() => removeSet(set.id)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ml-4 px-2 py-1 text-xs tracking-wide text-[var(--muted)] hover:text-[var(--fg)]"
        aria-label="Delete set"
      >
        REMOVE
      </button>

      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </li>
  );
}
