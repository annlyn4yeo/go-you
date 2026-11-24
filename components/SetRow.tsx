"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkoutStore } from "@/state/workoutStore";
import type { SetEntry } from "@/domain/workout";
import { formatLoad, setProblem } from "@/lib/lift";
import { PR_LABEL, type PrKind } from "@/lib/prs";

export default function SetRow({
  set,
  index,
  pr,
  isNew,
  onRemove,
}: {
  set: SetEntry;
  index: number;
  pr: PrKind | null; // which kind of PR this set is, if any (DD-048)
  isNew: boolean;
  onRemove: (id: string) => void;
}) {
  const isPr = pr !== null;
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const [editing, setEditing] = useState(false);
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [swiping, setSwiping] = useState(false); // DELETE sits under the row only while it is being swiped
  const row = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; t: number; id: number; dx: number; axis: "x" | "y" | null; armed: boolean } | null>(null);
  const swiped = useRef(false);
  const n = index + 1;

  function startEdit() {
    setReps(String(set.reps));
    setWeight(String(set.weight));
    setError(null);
    setEditing(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const problem = setProblem(reps, weight); // same limits as the server, so an edit can't make the save fail later
    if (problem) return setError(problem);
    updateSet(set.id, { reps: Number(reps), weight: Number(weight) });
    setEditing(false);
  }

  const tone = isPr ? "bg-[var(--fg)] text-[var(--bg)]" : `bg-[var(--bg)] ${isNew ? "stamp" : ""}`;

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

  // Swipe left to delete (DEL stays: never a gesture-only path). The row follows the finger 1:1 once the drag is clearly sideways
  // (10px), uncovers DELETE underneath, and deletes past 40% of its width or on a quick flick; otherwise it springs back.
  // Rightward drags meet resistance. Vertical drags are left to the page scroll (touch-action: pan-y).
  function onPointerDown(e: React.PointerEvent) {
    if (drag.current || e.button !== 0) return; // one finger at a time
    swiped.current = false;
    drag.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId, dx: 0, axis: null, armed: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    const el = row.current;
    if (!d || !el || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    if (!d.axis) {
      if (Math.hypot(dx, e.clientY - d.y) < 10) return;
      d.axis = Math.abs(dx) > Math.abs(e.clientY - d.y) ? "x" : "y";
      if (d.axis === "x") e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (d.axis !== "x") return;
    if (!swiping) setSwiping(true);
    d.dx = dx < 0 ? dx : dx * 0.2;
    const armed = -d.dx > el.offsetWidth * 0.4;
    if (armed && !d.armed) navigator.vibrate?.(8); // the point of no return is felt once
    d.armed = armed;
    el.style.transition = "none";
    el.style.transform = `translateX(${d.dx}px)`;
  }

  function onPointerEnd(e: React.PointerEvent) {
    const d = drag.current;
    const el = row.current;
    drag.current = null;
    if (!d || !el || d.axis !== "x") return;
    swiped.current = true; // the click that follows a swipe must not open the editor
    const flick = -d.dx > 24 && -d.dx / Math.max(1, e.timeStamp - d.t) > 0.11;
    const remove = e.type === "pointerup" && (d.armed || flick);
    el.style.transition = "transform 200ms var(--ease-out)";
    el.style.transform = remove ? "translateX(-100%)" : "";
    setTimeout(() => (remove ? onRemove(set.id) : setSwiping(false)), 200);
  }

  return (
    <li
      className="relative overflow-hidden border-t border-[var(--divider)]"
      onClickCapture={(e) => {
        if (!swiped.current) return;
        swiped.current = false; // consumed: a later keyboard click on this row works
        e.stopPropagation();
      }}
    >
      {swiping && (
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-end bg-[var(--fg)] pr-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--bg)]">
          Delete
        </span>
      )}
      <div
        ref={row}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className={`relative grid touch-pan-y grid-cols-[2rem_1fr_auto] items-center ${tone}`}
      >
        <span className={`pl-1 text-xs font-semibold tabular ${isPr ? "" : "text-[var(--muted)]"}`}>{n}</span>
        <button
          type="button"
          onClick={startEdit}
          aria-label={`Set ${n}: ${set.reps} × ${formatLoad(set.weight, set.unit)}${pr ? `, ${PR_LABEL[pr]}` : ""}. Edit`}
          className="press flex h-12 items-center gap-3 text-left text-lg font-semibold tabular"
        >
          {set.reps} × {formatLoad(set.weight, set.unit)}
          {pr && <span className="tag">{PR_LABEL[pr]}</span>}
        </button>
        <button
          type="button"
          onClick={() => onRemove(set.id)}
          aria-label={`Remove set ${n}`}
          className={`press h-11 w-14 text-xs font-semibold uppercase tracking-[0.16em] ${isPr ? "" : "text-[var(--muted)]"}`}
        >
          Del
        </button>
      </div>
    </li>
  );
}

// What's left of a removed set (DD-063): same row, same height, so nothing below moves. The value struck through, and
// Undo in exactly the column DEL was in, so the thumb that removed it can put it back without moving.
// Stays until the next set is logged or something else is removed: no timer to race.
export function RemovedSetRow({ set, onUndo }: { set: SetEntry; onUndo: () => void }) {
  return (
    <li className="ghost border-t border-[var(--divider)]">
      <div className="grid h-12 grid-cols-[2rem_1fr_auto] items-center">
        <span aria-hidden="true" className="pl-1 text-xs font-semibold text-[var(--muted)]">
          –
        </span>
        <span className="flex min-w-0 items-baseline gap-3">
          <s className="text-lg font-semibold tabular text-[var(--muted)]">
            {set.reps} × {formatLoad(set.weight, set.unit)}
          </s>
          <span className="label">Removed</span>
        </span>
        <UndoButton label={`Undo: put back ${set.reps} × ${formatLoad(set.weight, set.unit)}`} onUndo={onUndo} className="w-14" />
      </div>
    </li>
  );
}

// Undo, shared by removed sets and exercises. Keyboard users whose DEL/Remove button just vanished land on it (focus would
// otherwise fall to the page); a finger tap leaves nothing visibly focused.
export function UndoButton({ label, onUndo, className = "" }: { label: string; onUndo: () => void; className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!document.activeElement || document.activeElement === document.body) ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <button
      ref={ref}
      type="button"
      onClick={onUndo}
      aria-label={label}
      className={`press h-11 text-xs font-bold uppercase tracking-[0.16em] ${className}`}
    >
      <span className="border-b border-current pb-0.5">Undo</span>
    </button>
  );
}
