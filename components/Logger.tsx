"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkoutStore } from "@/state/workoutStore";
import type { ExerciseInstance, SetEntry } from "@/domain/workout";
import type { ExerciseHistory } from "@/lib/history";
import { durationMinutes, formatLoad, formatNumber, fromKg, prFlags, sessionSummary, toKg, type Unit } from "@/lib/lift";
import AddExerciseInput from "@/components/AddExerciseInput";
import NumberField from "@/components/NumberField";
import SetRow from "@/components/SetRow";
import StatGrid from "@/components/StatGrid";

export type Receipt = { duration: string; sets: number; prs: number; prNames: string[] };

const pad = (n: number) => String(n).padStart(2, "0");
function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600) ? `${Math.floor(s / 3600)}:` : ""}${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}
const minutes = (startedAt: string) => `${durationMinutes(Date.parse(startedAt), Date.now())}M`;
const buzz = (pattern: number | number[]) => navigator.vibrate?.(pattern);

export default function Logger({
  history,
  onSaved,
}: {
  history: ExerciseHistory;
  onSaved: (receipt: Receipt) => void;
}) {
  const router = useRouter();
  const active = useWorkoutStore((s) => s.activeWorkout)!;
  const unit = useWorkoutStore((s) => s.unit);
  const { setUnit, addExercise, endWorkout, removeSet, restoreSet } = useWorkoutStore.getState();

  const [finishing, setFinishing] = useState(false);
  const sheetTitle = useRef<HTMLHeadingElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [undo, setUndo] = useState<SetEntry | null>(null);
  const [announce, setAnnounce] = useState("");
  const [lastLogged, setLastLogged] = useState<string | null>(null);

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 5000);
    return () => clearTimeout(t);
  }, [undo]);

  useEffect(() => {
    if (!confirmDiscard) return;
    const t = setTimeout(() => setConfirmDiscard(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDiscard]);

  // Move focus into the sheet when it opens, so keyboard and screen-reader users land in it.
  useEffect(() => {
    if (finishing) sheetTitle.current?.focus({ preventScroll: true });
  }, [finishing]);

  const flags = new Map<string, boolean>();
  for (const ex of active.exercises) {
    const sets = active.sets.filter((s) => s.exerciseInstanceId === ex.id);
    prFlags(sets, history.bestE1rmKg[ex.exerciseId]).forEach((pr, i) => flags.set(sets[i].id, pr));
  }
  const prExercises = [...new Set(active.sets.filter((s) => flags.get(s.id)).map((s) => s.exerciseInstanceId))].map(
    (id) => active.exercises.find((e) => e.id === id)!.label.toUpperCase(),
  );
  const volumeKg = active.sets.reduce((sum, s) => sum + toKg(s.weight, s.unit) * s.reps, 0);

  function handleAdd(exerciseId: string, label: string) {
    const id = addExercise(exerciseId, label);
    requestAnimationFrame(() => {
      const input = document.getElementById(`reps-${id}`);
      input?.scrollIntoView({ block: "center", behavior: "smooth" });
      input?.focus({ preventScroll: true });
    });
  }

  function handleLogged(entry: SetEntry, pr: boolean) {
    setLastLogged(entry.id);
    setAnnounce(`Set logged, ${entry.reps} × ${formatLoad(entry.weight, entry.unit)}${pr ? ". Personal record." : ""}`);
    buzz(pr ? [0, 30, 40, 30] : 8);
  }

  function handleRemove(id: string) {
    const removed = removeSet(id);
    if (removed) setUndo(removed);
  }

  async function save() {
    const w = useWorkoutStore.getState().activeWorkout;
    if (!w || saving) return;
    setSaving(true);
    setSaveError(null);
    const withSets = new Set(w.sets.map((s) => s.exerciseInstanceId));
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workout: { id: w.workout.id, startedAt: w.workout.startedAt, endedAt: new Date().toISOString() },
          // Exercises without a set are not part of the workout.
          exercises: w.exercises.filter((e) => withSets.has(e.id)).map((e, order) => ({ ...e, order })),
          sets: w.sets,
        }),
      });
      if (!res.ok) {
        const reason =
          res.status === 401
            ? "You are signed out. Log in again."
            : ((await res.json().catch(() => null))?.error ?? `Server error ${res.status}.`);
        throw new Error(reason);
      }
      onSaved({ duration: minutes(w.workout.startedAt), sets: w.sets.length, prs: prExercises.length, prNames: prExercises });
      // Only clear the workout once the server has it.
      endWorkout();
      window.scrollTo(0, 0);
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof TypeError ? "No connection." : e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-8">
      {/* Workout bar: where am I, how long, how much, and the way out. */}
      <div className="sticky top-0 z-30 -mx-4 flex h-[var(--tap-lg)] items-center gap-3 bg-[var(--fg)] px-4 text-[var(--bg)] md:mx-0">
        <span className="min-w-0 flex-1 truncate text-sm font-bold uppercase tracking-[0.08em]">{active.title ?? "Workout"}</span>
        <WorkoutClock startedAt={active.workout.startedAt} />
        <span className="text-xs font-semibold tabular">{active.sets.length} SETS</span>
        <button
          type="button"
          onClick={() => setFinishing(true)}
          className="press h-10 bg-[var(--bg)] px-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--fg)]"
        >
          Finish
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="label">Workout in progress</h1>
        <div role="group" aria-label="Weight unit" className="grid grid-cols-2 border border-[var(--control)]">
          {(["kg", "lb"] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unit === u}
              onClick={() => setUnit(u)}
              className={`press h-9 w-12 text-xs font-bold uppercase ${unit === u ? "bg-[var(--fg)] text-[var(--bg)]" : ""}`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {active.exercises.map((ex) => (
          <ExerciseBlock
            key={ex.id}
            exercise={ex}
            sets={active.sets.filter((s) => s.exerciseInstanceId === ex.id)}
            flags={flags}
            last={history.last[ex.exerciseId]}
            bestKg={history.bestE1rmKg[ex.exerciseId]}
            unit={unit}
            lastLogged={lastLogged}
            onLogged={handleLogged}
            onRemove={handleRemove}
          />
        ))}
      </div>

      <section className="border-t-2 border-[var(--fg)] pt-6">
        <AddExerciseInput onAdd={handleAdd} suggestions={Object.keys(history.bestE1rmKg)} />
      </section>

      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      {undo && (
        <div className="fixed inset-x-0 bottom-[calc(var(--tap-lg)+env(safe-area-inset-bottom))] z-40 bg-[var(--fg)] text-[var(--bg)] md:bottom-0 md:left-[220px]">
          <div className="flex h-[var(--tap-lg)] items-center justify-between px-4">
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">Set removed</span>
            <button
              type="button"
              onClick={() => {
                restoreSet(undo);
                setUndo(null);
              }}
              className="press h-10 bg-[var(--bg)] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--fg)]"
            >
              Undo
            </button>
          </div>
          <div key={undo.id} className="drain h-px bg-[var(--bg)]" />
        </div>
      )}

      {/* Finish sheet: the receipt before saving. Stays mounted so it leaves the way it came. */}
      <div
        aria-hidden={!finishing}
        onClick={() => setFinishing(false)}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${finishing ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-title"
        inert={!finishing}
        data-open={finishing}
        onKeyDown={(e) => e.key === "Escape" && setFinishing(false)}
        className="sheet fixed inset-x-0 bottom-0 z-50 border-t-2 border-[var(--fg)] bg-[var(--bg)] px-4 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:left-[220px]"
      >
        <div className="mx-auto max-w-xl space-y-5">
          <h2 id="finish-title" ref={sheetTitle} tabIndex={-1} className="display text-3xl outline-none">
            Finish workout
          </h2>
          <StatGrid
            size="text-xl"
            items={[
              ["Time", minutes(active.workout.startedAt)],
              ["Sets", String(active.sets.length)],
              [`Vol ${unit}`, formatNumber(Math.round(fromKg(volumeKg, unit)))],
              ["PRs", String(prExercises.length)],
            ]}
          />
          {prExercises.length > 0 && <p className="text-sm font-semibold">PR · {prExercises.join(" · ")}</p>}

          {saveError && (
            <div role="alert" className="border border-[var(--danger)] px-4 py-3 text-sm text-[var(--danger)]">
              Not saved. {saveError} Your sets are kept on this device.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setFinishing(false)} className="btn btn-lg">
              Keep going
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || active.sets.length === 0}
              aria-busy={saving}
              className="btn btn-primary btn-lg"
            >
              {saving ? "Saving…" : saveError ? "Retry" : "Save workout"}
            </button>
          </div>
          {active.sets.length === 0 && <p className="text-xs text-[var(--muted)]">Log at least one set to save.</p>}

          <button
            type="button"
            onClick={() => {
              if (!confirmDiscard) return setConfirmDiscard(true);
              endWorkout();
              window.scrollTo(0, 0);
            }}
            className="press label w-full py-2 text-center text-[var(--danger)]"
          >
            {confirmDiscard ? "Tap again to discard all sets" : "Discard workout"}
          </button>
        </div>
      </section>
    </section>
  );
}

function WorkoutClock({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <time className="text-sm font-semibold tabular" aria-label="Elapsed time">
      {clock(now - Date.parse(startedAt))}
    </time>
  );
}

function ExerciseBlock({
  exercise,
  sets,
  flags,
  last,
  bestKg,
  unit,
  lastLogged,
  onLogged,
  onRemove,
}: {
  exercise: ExerciseInstance;
  sets: SetEntry[];
  flags: Map<string, boolean>;
  last?: { reps: number; weight: number; unit: string }[];
  bestKg?: number;
  unit: Unit;
  lastLogged: string | null;
  onLogged: (entry: SetEntry, pr: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const addSet = useWorkoutStore((s) => s.addSet);
  // Pre-fill from the last set today, else from last session (converted to the current unit).
  const seed = sets.at(-1) ?? last?.[0];
  const seedWeight = seed ? Math.round(fromKg(toKg(seed.weight, seed.unit), unit) * 2) / 2 : undefined;
  const [reps, setReps] = useState(seed ? String(seed.reps) : "");
  const [weight, setWeight] = useState(seedWeight != null ? String(seedWeight) : "");
  const [error, setError] = useState<string | null>(null);

  function log(e: React.FormEvent) {
    e.preventDefault();
    const r = Number(reps);
    const w = weight.trim() === "" ? NaN : Number(weight);
    if (!Number.isInteger(r) || r < 1 || r > 1000) return setError("Reps must be a whole number from 1.");
    if (!Number.isFinite(w) || w < 0 || w > 2000) return setError("Weight must be 0 (bodyweight) or more.");
    setError(null);
    const entry = addSet(exercise.id, r, w, unit);
    onLogged(entry, prFlags([...sets, entry], bestKg).at(-1)!);
    document.getElementById(`reps-${exercise.id}`)?.focus({ preventScroll: true });
  }

  return (
    <article className="space-y-4" aria-labelledby={`ex-${exercise.id}`}>
      <header className="space-y-1 border-t-2 border-[var(--fg)] pt-4">
        <h2 id={`ex-${exercise.id}`} className="text-xl font-bold uppercase leading-tight tracking-[-0.01em]">
          {exercise.label}
        </h2>
        <p className="label">{last ? `Last · ${sessionSummary(last)}` : "First time"}</p>
      </header>

      {sets.length > 0 && (
        <ol className="border-b border-[var(--divider)]">
          {sets.map((s, i) => (
            <SetRow key={s.id} set={s} index={i} isPr={!!flags.get(s.id)} isNew={s.id === lastLogged} onRemove={onRemove} />
          ))}
        </ol>
      )}

      <form onSubmit={log} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <NumberField id={`reps-${exercise.id}`} label="Reps" value={reps} onChange={setReps} step={1} min={1} large />
          <NumberField
            id={`weight-${exercise.id}`}
            label={`Weight · ${unit}`}
            value={weight}
            onChange={setWeight}
            step={unit === "kg" ? 2.5 : 5}
            decimal
            large
          />
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-full">
          Log set
        </button>
        {error && (
          <p role="alert" className="text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
      </form>
    </article>
  );
}
