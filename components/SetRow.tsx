"use client";

import { useState } from "react";
import { useWorkoutStore } from "@/state/workoutStore";
import type { SetEntry } from "@/domain/workout";
import { formatLoad } from "@/lib/lift";

export default function SetRow({
  set,
  index,
  isPr,
  isNew,
  onRemove,
}: {
  set: SetEntry;
  index: number;
  isPr: boolean;
  isNew: boolean;
  onRemove: (id: string) => void;
}) {
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const [editing, setEditing] = useState(false);
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const n = index + 1;

  function startEdit() {
    setReps(String(set.reps));
    setWeight(String(set.weight));
    setError(null);
    setEditing(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const r = Number(reps);
    const w = Number(weight);
    if (!Number.isInteger(r) || r < 1) return setError("Reps must be a whole number from 1.");
    if (weight.trim() === "" || !Number.isFinite(w) || w < 0) return setError("Weight must be 0 (bodyweight) or more.");
    updateSet(set.id, { reps: r, weight: w });
    setEditing(false);
  }

  const tone = isPr ? "bg-[var(--fg)] text-[var(--bg)]" : isNew ? "stamp" : "";

  if (editing) {
    return (
      <li className="border-t border-[var(--divider)] py-2">
        <form
          onSubmit={save}
          onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          className="grid grid-cols-[2rem_1fr_auto_1fr_auto] items-center gap-2"
          aria-label={`Edit set ${n}`}
        >
          <span className="label tabular">{n}</span>
          <input aria-label="Reps" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} className="field h-11 text-center tabular" autoFocus />
          <span aria-hidden="true">×</span>
          <input aria-label={`Weight in ${set.unit}`} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(",", "."))} className="field h-11 text-center tabular" />
          <span className="flex gap-1">
            <button type="submit" className="btn btn-primary h-11 px-3">
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn h-11 px-3">
              ✕<span className="sr-only">Cancel</span>
            </button>
          </span>
        </form>
        {error && (
          <p role="alert" className="mt-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
      </li>
    );
  }

  return (
    <li className={`grid grid-cols-[2rem_1fr_auto] items-center border-t border-[var(--divider)] ${tone}`}>
      <span className={`pl-1 text-xs font-semibold tabular ${isPr ? "" : "text-[var(--muted)]"}`}>{n}</span>
      <button
        type="button"
        onClick={startEdit}
        aria-label={`Set ${n}: ${set.reps} × ${formatLoad(set.weight, set.unit)}${isPr ? ", personal record" : ""}. Edit`}
        className="press flex h-12 items-center gap-3 text-left text-lg font-semibold tabular"
      >
        {set.reps} × {formatLoad(set.weight, set.unit)}
        {isPr && <span className="tag">PR</span>}
      </button>
      <button
        type="button"
        onClick={() => onRemove(set.id)}
        aria-label={`Remove set ${n}`}
        className={`press h-11 w-14 text-xs font-semibold uppercase tracking-[0.16em] ${isPr ? "" : "text-[var(--muted)]"}`}
      >
        Del
      </button>
    </li>
  );
}
