"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cleanTitle, TITLE_MAX } from "@/lib/workout-name";

const PICKS = ["Push", "Pull", "Legs", "Upper body", "Full body"];
const ERRORS: Record<string, string> = {
  offline: "Could not save the name. Check your connection and try again.",
  gone: "This workout was deleted on another device, so it can't be renamed.",
  refused: "Could not save that name. Try different words.",
};
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase(); // names show in capitals: case is invisible

// Log detail header (DD-062): the date line, the workout's name as the h1, and Rename. The time word ("Morning") is a fact
// from the start time, so it stays fixed; the lifter only sets what was trained. Editing swaps the h1 for a field in place
// (no motion: a rare, quick edit). Quick picks fill the type; Save stores it; "Use auto type" clears it.
// `known` false = the automatic type is only "workout": the field starts empty rather than make the lifter delete it.
export default function RenameWorkout(props: { id: string; meta: string; time: string; auto: string; known: boolean; title: string | null }) {
  const { id, meta, time, auto, known, title } = props;
  const router = useRouter();
  const [type, setType] = useState(title); // shown at once after a save, before the refresh lands
  const [value, setValue] = useState<string | null>(null); // null = not editing
  const [state, setState] = useState<"idle" | "saving" | "offline" | "gone" | "refused">("idle");
  const renameButton = useRef<HTMLButtonElement>(null);
  const name = `${time} ${type ?? auto}`;

  const close = () => {
    setValue(null);
    setState("idle");
    requestAnimationFrame(() => renameButton.current?.focus());
  };

  async function save(next: string | null) {
    const clean = cleanTitle(next); // undefined (not acceptable) is left out of the body, so the server answers 400
    const title = clean && same(clean, auto) ? null : clean; // the automatic type typed back = no own type
    setState("saving");
    const res = await fetch("/api/workouts", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, title }),
    }).catch(() => null);
    if (!res?.ok) return setState(!res ? "offline" : res.status === 404 ? "gone" : "refused");
    setType(title ?? null);
    close();
    router.refresh();
  }

  return (
    <header className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="label">{meta}</p>
        {value === null && (
          <button ref={renameButton} type="button" onClick={() => setValue(type ?? (known ? auto : ""))} className="press label -my-3 min-h-[var(--tap)] text-[var(--fg)]">
            Rename
          </button>
        )}
      </div>

      {value === null ? (
        <h1 className="display break-words text-5xl">{name}</h1>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save(value);
          }}
          onKeyDown={(e) => e.key === "Escape" && close()}
        >
          <h1 className="sr-only">{name}</h1>
          <label htmlFor="workout-type" className="label block">
            What did you train?
          </label>
          {/* The time word sits in front of the field, ruled like it but muted: part of the name, not editable. */}
          <div className="flex text-2xl font-bold uppercase tracking-[-0.01em]">
            <span id="workout-time" className="flex shrink-0 items-center border border-r-0 border-[var(--control)] px-3 text-[var(--muted)]">
              {time}
            </span>
            <input
              id="workout-type"
              aria-describedby="workout-time"
              className="field min-h-[var(--tap-lg)] min-w-0 text-2xl font-bold uppercase tracking-[-0.01em] placeholder:font-normal placeholder:normal-case"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={TITLE_MAX}
              autoFocus
              autoComplete="off"
              enterKeyHint="done"
              placeholder="e.g. leg day"
            />
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Quick types" role="group">
            {PICKS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={same(value.trim(), p)}
                onClick={() => setValue(p)}
                className={`btn px-3 text-xs ${same(value.trim(), p) ? "btn-primary" : ""}`}
              >
                {p}
              </button>
            ))}
          </div>
          {ERRORS[state] && (
            <p role="alert" className="border border-red-600 px-4 py-3 text-sm text-red-700">
              {ERRORS[state]}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={close} className="btn">
              Cancel
            </button>
            <button type="submit" disabled={state === "saving"} aria-busy={state === "saving"} className="btn btn-primary">
              {state === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
          {type !== null && (
            <button type="button" disabled={state === "saving"} onClick={() => save(null)} className="press label min-h-[var(--tap)] text-[var(--fg)]">
              Use auto type: {auto}
            </button>
          )}
        </form>
      )}
    </header>
  );
}
