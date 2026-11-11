"use client";

import { useEffect, useRef } from "react";
import { useWorkoutStore } from "@/state/workoutStore";
import { useNow } from "@/lib/useNow";
import { formatClock } from "@/lib/time";
import { REST_TARGETS, restState } from "@/lib/rest";

// Rest strip under the workout bar (DD-038).
// Resting: counts DOWN the rest left. Done: inverts to a static REST DONE · GO (no ticking) and buzzes once.
// The target is a visible segmented choice, not a hidden tap-to-cycle.
export default function RestTimer({ lastSetAt }: { lastSetAt: string }) {
  const target = useWorkoutStore((s) => s.restTarget);
  const setTarget = useWorkoutStore((s) => s.setRestTarget);
  const lastSetMs = Date.parse(lastSetAt);
  // Ticks only until the rest is over: the done state is static.
  const now = useNow(1000, lastSetMs + target * 1000);
  const { remainingMs, done } = restState(lastSetMs, now, target);

  // Buzz only when this screen sees rest go from running to done, and only if the user is looking.
  // Starting from the current state keeps a remount or reload that is already done silent.
  const wasDone = useRef(done);
  useEffect(() => {
    if (done && !wasDone.current && document.visibilityState === "visible") navigator.vibrate?.([0, 200, 100, 200]);
    wasDone.current = done;
  }, [done]);

  const ink = done ? "bg-[var(--fg)] text-[var(--bg)]" : "bg-[var(--bg)] text-[var(--fg)]";

  return (
    <div className={`flex h-[var(--tap-lg)] items-center gap-4 border-b border-[var(--fg)] px-4 ${ink} ${done ? "border-t border-t-[var(--muted)]" : ""}`}>
      <div className="min-w-0 flex-1 leading-none">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">{done ? "Rest done" : "Rest left"}</span>
        {done ? (
          <span className="mt-1 block text-2xl font-bold uppercase tracking-[-0.02em]">Go</span>
        ) : (
          <time role="timer" aria-label="Rest remaining" className="mt-1 block text-2xl font-bold tracking-[-0.02em] tabular">
            {formatClock(Math.ceil(remainingMs / 1000) * 1000) /* countdowns round up: a fresh 2:00 reads 2:00 */}
          </time>
        )}
      </div>
      <div role="group" aria-label="Rest target" className="grid grid-cols-4 gap-px border border-current bg-current">
        {REST_TARGETS.map((t) => {
          const on = t === target;
          return (
            <button
              key={t}
              type="button"
              aria-pressed={on}
              aria-label={`Rest ${formatClock(t * 1000)}`}
              onClick={() => setTarget(t)}
              className={`press h-11 w-11 text-xs font-bold tabular ${on === done ? "bg-[var(--bg)] text-[var(--fg)]" : "bg-[var(--fg)] text-[var(--bg)]"}`}
            >
              {formatClock(t * 1000)}
            </button>
          );
        })}
      </div>
      <span role="status" className="sr-only">
        {done ? "Rest done. Go." : ""}
      </span>
    </div>
  );
}
